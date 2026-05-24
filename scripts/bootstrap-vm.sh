#!/usr/bin/env bash
# Run on the VM (via deploy/vm-bootstrap.sh) before docker compose up.
# Idempotent: safe to run on every deploy. Creates the focusroom_app
# Postgres role on first run, materializes /opt/pritika/_infra/focusroom.env,
# and ensures FOCUSROOM_DB_PASSWORD is persisted to the shared infra env
# so subsequent boots reuse it.

set -euo pipefail

INFRA_ENV="/opt/pritika/_infra/.env"
PROJECT_ENV="/opt/pritika/_infra/focusroom.env"
DB_NAME="postgres"

log() { printf "[bootstrap-vm] %s\n" "$*"; }

if [ ! -f "$INFRA_ENV" ]; then
  echo "ERROR: $INFRA_ENV not found -- run setup-vm.sh first." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
. "$INFRA_ENV"
set +a

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "ERROR: POSTGRES_PASSWORD missing from $INFRA_ENV" >&2
  exit 1
fi
if [ -z "${AZURE_OPENAI_ENDPOINT:-}" ]; then
  echo "ERROR: AZURE_OPENAI_ENDPOINT missing from $INFRA_ENV" >&2
  exit 1
fi
if [ -z "${FOCUSROOM_CONTENT_SAFETY_ENDPOINT:-}" ]; then
  echo "ERROR: FOCUSROOM_CONTENT_SAFETY_ENDPOINT missing from $INFRA_ENV" >&2
  exit 1
fi

if [ -z "${FOCUSROOM_DB_PASSWORD:-}" ]; then
  FOCUSROOM_DB_PASSWORD="$(openssl rand -hex 32)"
  printf '\nFOCUSROOM_DB_PASSWORD=%s\n' "$FOCUSROOM_DB_PASSWORD" >> "$INFRA_ENV"
  log "Generated new FOCUSROOM_DB_PASSWORD"
fi

# Helper -- run psql against pritika-postgres as the superuser. The -i
# flag is essential so docker forwards stdin (lets us pipe SQL heredocs
# to psql).
pg_super() {
  docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" pritika-postgres \
    psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

# Create or update the focusroom_app role. The hex password from
# openssl rand is shell-safe (no quotes, no special chars), so we can
# embed it directly into the SQL string.
log "Ensuring focusroom_app role"
ROLE_EXISTS="$(pg_super -tAc "SELECT 1 FROM pg_roles WHERE rolname='focusroom_app'")"
if [ -z "$ROLE_EXISTS" ]; then
  pg_super -c "CREATE ROLE focusroom_app LOGIN PASSWORD '$FOCUSROOM_DB_PASSWORD'"
  log "Created focusroom_app role"
else
  pg_super -c "ALTER ROLE focusroom_app WITH PASSWORD '$FOCUSROOM_DB_PASSWORD'"
  log "Updated focusroom_app password"
fi

log "Ensuring database + schema + grants"
pg_super <<'SQL'
GRANT CONNECT ON DATABASE postgres TO focusroom_app;
CREATE SCHEMA IF NOT EXISTS focusroom AUTHORIZATION focusroom_app;
GRANT USAGE, CREATE ON SCHEMA focusroom TO focusroom_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA focusroom TO focusroom_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA focusroom GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO focusroom_app;
SQL

umask 077
cat > "$PROJECT_ENV" <<EOF
NODE_ENV=production
PORT=3016
LOG_LEVEL=info
DATABASE_URL=postgres://focusroom_app:${FOCUSROOM_DB_PASSWORD}@pritika-postgres:5432/${DB_NAME}?options=-csearch_path%3Dfocusroom
AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini
FOCUSROOM_CONTENT_SAFETY_ENDPOINT=${FOCUSROOM_CONTENT_SAFETY_ENDPOINT}
FOCUSROOM_DAILY_BUDGET_USD=0
FOCUSROOM_IP_DENYLIST=
EOF
log "Wrote $PROJECT_ENV (mode 600)"
log "Bootstrap complete"
