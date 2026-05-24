#!/bin/sh
# Executed on the VM by `az vm run-command invoke`. Idempotent.
# Clones (or pulls) the repo, runs scripts/bootstrap-vm.sh, brings
# docker compose up with --build, then probes /health.

set -eu

PROJECT=focusroom
TARGET=/opt/pritika/${PROJECT}

log() { printf '[deploy] %s\n' "$*"; }

if [ ! -d "$TARGET/.git" ]; then
  log "First deploy -- cloning"
  git clone --depth 1 https://github.com/pritika292/${PROJECT}.git "$TARGET"
else
  log "Pulling latest main"
  cd "$TARGET"
  git fetch --depth 1 origin main
  git reset --hard origin/main
fi
cd "$TARGET"

if [ -x scripts/bootstrap-vm.sh ]; then
  log "Running bootstrap-vm.sh"
  bash scripts/bootstrap-vm.sh
fi

log "Building and restarting containers"
docker compose pull --quiet 2>/dev/null || true
docker compose up -d --build --remove-orphans

log "Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

i=0
while [ $i -lt 45 ]; do
  if docker exec focusroom wget -qO- http://localhost:3016/health >/dev/null 2>&1; then
    log "Health check passed: /health returned 2xx"
    exit 0
  fi
  i=$((i + 1))
  sleep 2
done
log "ERROR: /health did not return 2xx after 90s"
log "Container state:"
docker compose ps
log "Recent logs:"
docker compose logs --tail=120 app || true
exit 1
