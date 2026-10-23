#!/bin/bash
# Registers the Frontend Remix font helper with Firefox (one-time).
# Run:  bash ~/frontendremix/src/native/install.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
HOST="$HERE/frx_fonts_host.py"
DEST="$HOME/Library/Application Support/Mozilla/NativeMessagingHosts"

if ! /usr/bin/env python3 -c "import sys" >/dev/null 2>&1; then
  echo "python3 isn't available. Install Apple's command line tools first:  xcode-select --install"
  exit 1
fi

chmod +x "$HOST"
mkdir -p "$DEST"
cat > "$DEST/frontend_remix_fonts.json" <<EOF
{
  "name": "frontend_remix_fonts",
  "description": "Lists the fonts installed on this Mac for the Frontend Remix extension",
  "path": "$HOST",
  "type": "stdio",
  "allowed_extensions": ["frontend-remix@martin473.github.io"]
}
EOF

COUNT=$(printf '\x0f\x00\x00\x00{"cmd": "list"}' | "$HOST" | tail -c +5 | /usr/bin/env python3 -c "import json,sys; print(len(json.load(sys.stdin)['fonts']))")
echo "Installed. Found $COUNT font families. Reload Frontend Remix in Firefox (about:debugging) and reopen the popup."
