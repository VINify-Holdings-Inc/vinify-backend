#!/bin/bash
# Atomic release deploy: fresh clone + npm ci in an isolated release dir,
# type-check gate, symlink cutover, health check with auto-rollback, pruning.
# Runs on the server as root via SSM; drops to ubuntu for git/npm/pm2 so the
# ubuntu user's GitHub deploy key and PM2 process ownership are used.
set -e

REPO_URL="git@github.com-vinify-backend:VINify-Holdings-Inc/vinify-backend.git"
BRANCH="main"
NODE_BIN=/home/ubuntu/.nvm/versions/node/v22.16.0/bin
RELEASES_DIR=/var/www/api-releases
SHARED_DIR=/var/www/api-shared
CURRENT_LINK=/var/www/api
LOCK_FILE=/var/www/deploy.lock
KEEP_RELEASES=5

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  echo "Another deployment is already in progress. Exiting."
  exit 1
fi

RELEASE_ID=$(date +%Y%m%d%H%M%S)
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"

echo "==> Deploying release $RELEASE_ID"

mkdir -p "$RELEASES_DIR"
chown ubuntu:ubuntu "$RELEASES_DIR"

sudo -u ubuntu git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE_DIR"

echo "==> Linking shared persistent data"
sudo -u ubuntu ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
sudo -u ubuntu ln -sfn "$SHARED_DIR/DbConfig" "$RELEASE_DIR/src/DbConfig"
sudo -u ubuntu ln -sfn "$SHARED_DIR/uploads" "$RELEASE_DIR/src/uploads"

echo "==> Installing dependencies"
sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$RELEASE_DIR' && npm ci"

# Type-checking runs in CI (see .github/workflows/deploy.yml) before this
# script is ever invoked -- this box is memory-constrained (t2.micro, no
# swap headroom to spare), and a full tsc pass here is what caused the
# 2026-07-25 OOM-style stall. Keep the compile step off the production host.

PREVIOUS_RELEASE=$(readlink -f "$CURRENT_LINK")
echo "==> Previous release: $PREVIOUS_RELEASE"

echo "==> Cutting over symlink to new release"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$CURRENT_LINK' && pm2 reload ecosystem.config.js --env production"

echo "==> Waiting for health check"
PORT=$(grep -m1 '^PORT=' "$SHARED_DIR/.env" | cut -d= -f2 | tr -d '\r\n ')
HEALTHY=false
for i in $(seq 1 10); do
  sleep 2
  if curl -sf --max-time 3 "http://localhost:${PORT}/" > /dev/null; then
    HEALTHY=true
    break
  fi
done

if [ "$HEALTHY" != "true" ]; then
  echo "==> Health check failed. Rolling back to $PREVIOUS_RELEASE"
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
  sudo -u ubuntu env PATH="$NODE_BIN:$PATH" bash -c "cd '$CURRENT_LINK' && pm2 reload ecosystem.config.js --env production"
  rm -rf "$RELEASE_DIR"
  echo "Rolled back. Deploy failed."
  exit 1
fi

echo "==> Deploy healthy. Pruning old releases (keeping last $KEEP_RELEASES)"
cd "$RELEASES_DIR"
ls -1dt */ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r -I{} rm -rf "$RELEASES_DIR/{}"

echo "==> Deploy complete: $RELEASE_ID"
