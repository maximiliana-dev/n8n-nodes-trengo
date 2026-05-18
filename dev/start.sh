#!/usr/bin/env bash
set -euo pipefail

# Boots a local n8n container with this package installed as a community node.
# - Builds the package, packs it into a .tgz, installs it into ./dev/custom/
# - Starts n8n on http://localhost:2086 with an isolated volume
# - Webhooks live at http://localhost:2086/webhook/...
#
# Usage:
#   ./dev/start.sh           # build + install + up (foreground)
#   ./dev/start.sh --detach  # build + install + up -d
#   ./dev/start.sh --reset   # also wipes the n8n volume and custom/ before starting

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_DIR="$ROOT_DIR/dev"
CUSTOM_DIR="$DEV_DIR/custom"

DETACH=""
RESET=0
for arg in "$@"; do
  case "$arg" in
    --detach|-d) DETACH="-d" ;;
    --reset)     RESET=1 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

cd "$ROOT_DIR"

if [[ "$RESET" -eq 1 ]]; then
  echo "==> Resetting dev environment"
  docker compose -f "$DEV_DIR/docker-compose.yml" down -v 2>/dev/null || true
  rm -rf "$CUSTOM_DIR"
  mkdir -p "$CUSTOM_DIR"
fi

echo "==> Building package"
pnpm build >/dev/null

echo "==> Packing tarball"
rm -f "$ROOT_DIR"/maximiliana-n8n-nodes-trengo-*.tgz
TARBALL=$(pnpm pack 2>/dev/null | tail -1)
mv "$ROOT_DIR/$TARBALL" "$CUSTOM_DIR/package.tgz"

echo "==> Installing package into dev/custom"
cd "$CUSTOM_DIR"
if [[ ! -f package.json ]]; then
  npm init -y >/dev/null
fi
# Reinstall fresh so n8n picks up the new code on restart.
rm -rf node_modules package-lock.json
npm install ./package.tgz >/dev/null
cd "$ROOT_DIR"

echo "==> Starting n8n"
# --force-recreate ensures the n8n process reloads the community node code after
# we replace files under dev/custom. Without it, compose sees no config change
# and keeps the old process alive, serving stale code.
docker compose -f "$DEV_DIR/docker-compose.yml" up $DETACH ${DETACH:+--wait} --force-recreate

# When detached, auto-provision the owner so the UI skips the setup screen.
# Idempotent: if the owner already exists, /rest/owner/setup returns 400 and
# we just keep going.
if [[ -n "$DETACH" ]]; then
  echo "==> Waiting for n8n HTTP..."
  until curl -sf -o /dev/null http://localhost:2086; do sleep 1; done

  echo "==> Auto-provisioning owner account"
  curl -sf -X POST http://localhost:2086/rest/owner/setup \
    -H "Content-Type: application/json" \
    -d '{"email":"dev@maximiliana.local","firstName":"Dev","lastName":"User","password":"DevPass1234"}' \
    -o /dev/null && echo "    Owner created." || echo "    Owner already exists (skipping)."

  echo
  echo "==> Ready"
  echo "    Public UI:     https://n8n.tunel.granvia.maximiliana.es"
  echo "    Local UI:      http://localhost:2086 (will redirect/break; access via public URL)"
  echo "    Login:         dev@maximiliana.local / DevPass1234"
  echo "    Public webhook: https://n8n.tunel.granvia.maximiliana.es/webhook/<path>"
fi
