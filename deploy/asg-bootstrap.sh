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

if ! command -v aws >/dev/null; then
  cd /tmp
  curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
  unzip -q -o awscliv2.zip
  ./aws/install
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
  cat >> /home/ubuntu/.ssh/config <<'EOC'
Host github.com-vinify-backend
  HostName github.com
  User git
  IdentityFile /home/ubuntu/.ssh/vinify_backend_deploy
  IdentitiesOnly yes
EOC
fi
chown ubuntu:ubuntu /home/ubuntu/.ssh/config
chmod 600 /home/ubuntu/.ssh/config

touch /home/ubuntu/.ssh/known_hosts
ssh-keyscan github.com >> /home/ubuntu/.ssh/known_hosts 2>/dev/null
chown ubuntu:ubuntu /home/ubuntu/.ssh/known_hosts

mkdir -p "$SHARED_DIR/uploads"
aws secretsmanager get-secret-value --secret-id vinify-backend/production/env-file --region "$REGION" --query SecretString --output text > "$SHARED_DIR/.env"
chown -R ubuntu:ubuntu "$SHARED_DIR"

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

cat > /etc/nginx/sites-available/api <<EOC
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOC
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/api /etc/nginx/sites-enabled/api
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
