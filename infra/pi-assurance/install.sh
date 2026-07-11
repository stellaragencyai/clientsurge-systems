#!/usr/bin/env bash
set -Eeuo pipefail

ENABLE_RELEASE=0
ENABLE_REVENUE=0

usage() {
  cat <<'EOF'
Usage: sudo bash infra/pi-assurance/install.sh [options]

Options:
  --enable-release   Enable the GitHub-triggered release assurance timer.
  --enable-revenue   Enable the six-hour live checkout smoke timer.
  --enable-all       Enable watchdog, release assurance and revenue smoke.
  -h, --help         Show this help.

The public watchdog is always installed and enabled. Release assurance requires
CLIENTSURGE_GITHUB_TOKEN in /etc/clientsurge-assurance/assurance.env.
EOF
}

while (($#)); do
  case "$1" in
    --enable-release) ENABLE_RELEASE=1 ;;
    --enable-revenue) ENABLE_REVENUE=1 ;;
    --enable-all) ENABLE_RELEASE=1; ENABLE_REVENUE=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/opt/clientsurge-assurance"
CONFIG_DIR="/etc/clientsurge-assurance"
ENV_FILE="${CONFIG_DIR}/assurance.env"
SYSTEMD_DIR="/etc/systemd/system"

if ! command -v python3 >/dev/null 2>&1; then
  apt-get update
  apt-get install -y python3 ca-certificates
fi

# Fail closed before modifying the machine.
python3 -m py_compile "${SCRIPT_DIR}/clientsurge_assurance.py"
python3 -m unittest discover -s "${SCRIPT_DIR}/tests" -v
python3 - <<PY
import json
from pathlib import Path
path = Path(${SCRIPT_DIR@Q}) / "routes.json"
payload = json.loads(path.read_text(encoding="utf-8"))
assert payload.get("light"), "light route profile is empty"
assert payload.get("full"), "full route profile is empty"
print(f"Validated {len(payload['light'])} light routes and {len(payload['full'])} full routes.")
PY

install -d -m 0755 "${INSTALL_DIR}" "${CONFIG_DIR}"
install -m 0755 "${SCRIPT_DIR}/clientsurge_assurance.py" "${INSTALL_DIR}/clientsurge_assurance.py"
install -m 0644 "${SCRIPT_DIR}/routes.json" "${INSTALL_DIR}/routes.json"

if [[ ! -f "${ENV_FILE}" ]]; then
  install -m 0600 "${SCRIPT_DIR}/assurance.env.example" "${ENV_FILE}"
  echo "Created ${ENV_FILE}. Add Telegram and GitHub credentials before enabling optional timers."
else
  chmod 0600 "${ENV_FILE}"
  echo "Preserved existing ${ENV_FILE}."
fi

install -m 0644 "${SCRIPT_DIR}/systemd/clientsurge-assurance@.service" "${SYSTEMD_DIR}/clientsurge-assurance@.service"
install -m 0644 "${SCRIPT_DIR}/systemd/clientsurge-watchdog.timer" "${SYSTEMD_DIR}/clientsurge-watchdog.timer"
install -m 0644 "${SCRIPT_DIR}/systemd/clientsurge-release-assurance.timer" "${SYSTEMD_DIR}/clientsurge-release-assurance.timer"
install -m 0644 "${SCRIPT_DIR}/systemd/clientsurge-revenue-smoke.timer" "${SYSTEMD_DIR}/clientsurge-revenue-smoke.timer"

systemctl daemon-reload
systemctl enable --now clientsurge-watchdog.timer
systemctl start clientsurge-assurance@watchdog.service

if ((ENABLE_RELEASE)); then
  if grep -Eq '^CLIENTSURGE_GITHUB_TOKEN=.+$' "${ENV_FILE}"; then
    systemctl enable --now clientsurge-release-assurance.timer
  else
    echo "Release timer not enabled: CLIENTSURGE_GITHUB_TOKEN is blank in ${ENV_FILE}." >&2
    echo "Add a fine-grained Actions read-only token, then run:" >&2
    echo "  sudo systemctl enable --now clientsurge-release-assurance.timer" >&2
  fi
fi

if ((ENABLE_REVENUE)); then
  systemctl enable --now clientsurge-revenue-smoke.timer
fi

cat <<EOF

ClientSurge Assurance Node installed.

Active watchdog:
  systemctl status clientsurge-watchdog.timer --no-pager

Latest watchdog evidence:
  sudo cat /var/lib/clientsurge-assurance/latest-watchdog.json

Live logs:
  journalctl -u 'clientsurge-assurance@*' -f

Configuration:
  sudo nano ${ENV_FILE}

Optional timers:
  sudo systemctl enable --now clientsurge-release-assurance.timer
  sudo systemctl enable --now clientsurge-revenue-smoke.timer
EOF
