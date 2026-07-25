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

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
chown ubuntu:ubuntu "$APP_DIR"
sudo -u ubuntu git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
sudo -u ubuntu ln -sfn "$SHARED_DIR/.env" "$APP_DIR/.env"
sudo -u ubuntu ln -sfn "$SHARED_DIR/uploads" "$APP_DIR/src/uploads"

sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$APP_DIR' && npm ci"

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

env PATH="$NODE_BIN:$PATH" pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$APP_DIR' && pm2 start ecosystem.config.js --env production && pm2 save"
