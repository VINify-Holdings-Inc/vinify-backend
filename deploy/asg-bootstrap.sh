#!/bin/bash
# Launch-template user-data: bootstraps a fresh ASG instance into a working
# state from scratch. Runs as root via EC2 user-data on first boot.
#
# Known limitation: uploads written to this instance's local disk are not
# shared with other instances (including the standalone production box).
# Fine for now since this instance is additive scaling capacity, not the
# sole source of truth -- revisit (move uploads to S3) if the ASG ever
# scales beyond 1 instance or becomes the primary target.
set -ex
exec > /var/log/user-data.log 2>&1

REGION="us-east-1"
NODE_VERSION="22.16.0"
REPO_URL="git@github.com-vinify-backend:VINify-Holdings-Inc/vinify-backend.git"
BRANCH="main"
APP_DIR="/var/www/api"
RELEASES_DIR="/var/www/api-releases"
SHARED_DIR="/var/www/api-shared"
WEB_DIR="/var/www/web"
FRONTEND_BUCKET="vinify-frontend-deploy-artifacts"

if ! command -v aws >/dev/null; then
  cd /tmp
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
  unzip -q -o awscliv2.zip
  ./aws/install
fi

# t2.micro has thin RAM headroom; npm ci during deploys can otherwise cause
# the same OOM-style stalls seen on the standalone instance.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

id ubuntu || useradd -m -s /bin/bash ubuntu

sudo -u ubuntu bash -c '
  export NVM_DIR="/home/ubuntu/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  . "$NVM_DIR/nvm.sh"
  nvm install '"$NODE_VERSION"'
  npm install -g pm2
'

NODE_BIN="/home/ubuntu/.nvm/versions/node/v${NODE_VERSION}/bin"

mkdir -p /home/ubuntu/.ssh
aws secretsmanager get-secret-value --secret-id vinify-backend/production/deploy-key --region "$REGION" --query SecretString --output text > /home/ubuntu/.ssh/vinify_backend_deploy
chmod 600 /home/ubuntu/.ssh/vinify_backend_deploy
chown ubuntu:ubuntu /home/ubuntu/.ssh/vinify_backend_deploy

if ! grep -q "github.com-vinify-backend" /home/ubuntu/.ssh/config 2>/dev/null; then
  # Outbound port 22 is silently dropped somewhere upstream of this VPC's NAT
  # Gateway (confirmed via packet capture: SYNs leave, no reply ever returns,
  # for any destination on 22 -- not github-specific). Port 443 works fine,
  # so use GitHub's documented SSH-over-443 endpoint instead of github.com:22.
  cat >> /home/ubuntu/.ssh/config <<'EOC'
Host github.com-vinify-backend
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile /home/ubuntu/.ssh/vinify_backend_deploy
  IdentitiesOnly yes
EOC
fi
chown ubuntu:ubuntu /home/ubuntu/.ssh/config
chmod 600 /home/ubuntu/.ssh/config

touch /home/ubuntu/.ssh/known_hosts
ssh-keyscan -p 443 ssh.github.com >> /home/ubuntu/.ssh/known_hosts 2>/dev/null
chown ubuntu:ubuntu /home/ubuntu/.ssh/known_hosts

mkdir -p "$SHARED_DIR/uploads"
aws secretsmanager get-secret-value --secret-id vinify-backend/production/env-file --region "$REGION" --query SecretString --output text > "$SHARED_DIR/.env"

# RDS manages and rotates the master password on its own schedule, into its
# own Secrets Manager secret -- fetching it fresh at boot (rather than relying
# on the static copy above, which can go stale between rotations) means
# rotation is a non-event instead of a recurring outage.
DB_INSTANCE_ID="mvmprod"
DB_SECRET_ARN=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" --region "$REGION" \
  --query "DBInstances[0].MasterUserSecret.SecretArn" --output text)
DB_CREDS=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ARN" --region "$REGION" --query SecretString --output text)
DB_USERNAME=$(echo "$DB_CREDS" | python3 -c "import json,sys; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$DB_CREDS" | python3 -c "import json,sys; print(json.load(sys.stdin)['password'])")
sed -i '/^DB_USERNAME=/d; /^DB_PASSWORD=/d' "$SHARED_DIR/.env"
{
  echo "DB_USERNAME=\"$DB_USERNAME\""
  echo "DB_PASSWORD=\"$DB_PASSWORD\""
} >> "$SHARED_DIR/.env"

chown -R ubuntu:ubuntu "$SHARED_DIR"

mkdir -p "$WEB_DIR"
aws s3 sync "s3://${FRONTEND_BUCKET}/" "$WEB_DIR" --delete
chown -R ubuntu:ubuntu "$WEB_DIR"

# Clone into a timestamped release dir and symlink /var/www/api to it, matching
# the atomic-release convention used by deploy/remote-deploy.sh -- so that
# script's `ln -sfn` cutover works unmodified against this instance too,
# instead of failing trying to overwrite a plain directory.
RELEASE_DIR="$RELEASES_DIR/baseline-$(date +%Y%m%d%H%M%S)"
mkdir -p "$RELEASES_DIR"
chown ubuntu:ubuntu "$RELEASES_DIR"
sudo -u ubuntu git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE_DIR"
sudo -u ubuntu ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
sudo -u ubuntu ln -sfn "$SHARED_DIR/uploads" "$RELEASE_DIR/src/uploads"

# Install deps against the release dir directly, before the symlink cutover --
# not via $APP_DIR, since that may still be a stale pre-existing directory
# from the AMI at this point (rm -rf below only happens right after).
sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$RELEASE_DIR' && npm ci"

# rm -rf is required here: if $APP_DIR already exists as a real directory
# (e.g. baked into the AMI), `ln -sfn` does NOT replace it -- it silently
# creates the symlink *inside* that directory instead, leaving the stale
# directory (and whatever old app config it contains) as what actually runs.
rm -rf "$APP_DIR"
ln -sfn "$RELEASE_DIR" "$APP_DIR"

PORT=$(grep -m1 '^PORT=' "$SHARED_DIR/.env" | cut -d= -f2 | tr -d '\r\n ')

# default_server so ALB health checks (which hit the instance by IP, not a
# hostname) and api.getvinify.com both land here; app.getvinify.com below
# matches nginx's exact server_name first regardless of block order.
cat > /etc/nginx/sites-available/api.getvinify.com <<EOC
server {
    listen 80 default_server;
    server_name _;
    server_tokens off;

    gzip on;
    gzip_types application/json application/javascript text/plain;
    gzip_min_length 512;

    # Security headers -- closes findings from the OWASP ZAP baseline scan
    # (.github/workflows/dast-scan.yml); this is a pure JSON API, not an
    # HTML-rendering surface, so a restrictive CSP/COEP is safe here (it
    # would be wrong for app.getvinify.com, which actually loads scripts).
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'" always;
    add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cache-Control "no-store" always;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_hide_header X-Powered-By;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOC

cat > /etc/nginx/sites-available/app.getvinify.com <<'EOC'
server {
    listen 80;
    server_name app.getvinify.com;

    root /var/www/web;
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 512;

    location / {
        try_files $uri /index.html;
    }

    # Build assets are content-hashed (e.g. main-<hash>.js) -- safe to cache
    # aggressively/immutably, since a new deploy ships new filenames.
    location ~* \.(?:js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$ {
        try_files $uri =404;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # index.html must always be revalidated -- otherwise a browser that
    # cached the previous deploy's shell keeps requesting asset filenames
    # that no longer exist after the next deploy overwrites them.
    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
EOC

# The AMI carries a stale "api.getvinify.com.disabled" symlink in
# sites-enabled from whatever instance it was snapshotted from -- the
# ".disabled" suffix has no meaning to nginx (its sites-enabled/* include
# picks up any filename), so it silently double-loads our own config
# under its real target path and collides on "default server".
find /etc/nginx/sites-enabled/ -name '*.disabled' -delete
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/api.getvinify.com /etc/nginx/sites-enabled/api.getvinify.com
ln -sf /etc/nginx/sites-available/app.getvinify.com /etc/nginx/sites-enabled/app.getvinify.com
nginx -t
systemctl restart nginx

# The AMI this launch template uses was snapshotted from a real instance and
# may carry a stale ~/.pm2 state (e.g. an old app registered under a
# different name than what's in the committed ecosystem.config.js today).
# Wipe it so pm2 starts clean and the app comes up under the name the deploy
# pipeline actually expects.
rm -rf /home/ubuntu/.pm2
chown -R ubuntu:ubuntu /home/ubuntu

env PATH="$NODE_BIN:$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$APP_DIR' && pm2 start ecosystem.config.js --env production && pm2 save"

# Centralize nginx + PM2 logs to CloudWatch Logs -- without this, both live
# only on this instance's local disk and are lost the moment the ASG
# replaces it (instance refresh, scaling event, self-healing). The log
# stream name is the instance ID, so history survives replacement even
# though each instance's own local copy doesn't. EC2_SSM_VINRole already
# has CloudWatchAgentServerPolicy attached.
if ! command -v /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl >/dev/null 2>&1; then
  # cloud-init's own package management (or unattended-upgrades) can hold the
  # dpkg frontend lock during early boot -- wait for it to clear rather than
  # racing it, otherwise dpkg fails outright and, under set -e, silently
  # aborts everything after this point in the script.
  while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    sleep 2
  done
  curl -s -o /tmp/amazon-cloudwatch-agent.deb https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
  dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
fi

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOC'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/vinify/ec2/nginx-access",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 90
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/vinify/ec2/nginx-error",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 90
          },
          {
            "file_path": "/home/ubuntu/.pm2/logs/mvm-api-out.log",
            "log_group_name": "/vinify/ec2/pm2-out",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 90
          },
          {
            "file_path": "/home/ubuntu/.pm2/logs/mvm-api-error.log",
            "log_group_name": "/vinify/ec2/pm2-error",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 90
          }
        ]
      }
    }
  }
}
EOC

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
