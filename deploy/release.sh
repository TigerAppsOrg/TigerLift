#!/usr/bin/env bash
# Installed as /usr/local/sbin/tigerlift-deploy; invoked only by TigerLiftDeploy SSM.
set -Eeuo pipefail
umask 077
sha=${1:?commit required}
checksum=${2:?sha256 required}
[[ $sha =~ ^[0-9a-f]{40}$ && $checksum =~ ^[0-9a-f]{64}$ ]]
exec 9>/run/lock/tigerlift-deploy.lock
flock -w 900 9
base=/home/ubuntu/apps
releases=$base/tiger-lift-releases
current=$base/tiger-lift-current
legacy=$base/tiger-lift
release=$releases/$sha
mkdir -p "$releases" /var/backups/tigerlift
previous=$legacy
if [[ -L $current ]]; then previous=$(readlink -f "$current"); fi
archive=$(mktemp /tmp/tigerlift-release.XXXXXX)
trap 'rm -f "$archive"' EXIT
/opt/tigerlift-deploy-tools/bin/python - "$sha" "$archive" <<'PY'
import boto3, sys
boto3.client('s3', region_name='us-east-1').download_file(
    'tigerlift-deploy-104733724423-us-east-1', 'releases/' + sys.argv[1] + '.tar.gz', sys.argv[2])
PY
printf '%s  %s\n' "$checksum" "$archive" | sha256sum -c -
# Reuse a verified release on reruns; never overwrite the currently running directory.
if [[ ! -f $release/.ready ]]; then
  [[ ! -e $release ]] || { echo 'Incomplete release exists; inspect it before retrying.' >&2; exit 1; }
  mkdir "$release"
  tar -xzf "$archive" --no-same-owner -C "$release"
  test -s "$release/frontend/dist/index.html"
  test -s "$release/backend/app.py"
  ln -s "$legacy/backend/.env" "$release/backend/.env"
  chown -R ubuntu:ubuntu "$release"
  chmod 755 "$releases" "$release"
  sudo -u ubuntu python3 -m venv "$release/venv"
  sudo -u ubuntu "$release/venv/bin/pip" install --disable-pip-version-check -q -r "$release/backend/requirements.txt"
  touch "$release/.ready"
fi
# Preserve a restorable snapshot before applying the app's backward-compatible migrations.
cd "$release/backend"
"$release/venv/bin/python" - "/var/backups/tigerlift/$sha.dump" <<'PY'
import os, subprocess, sys
from urllib.parse import urlsplit, unquote
from dotenv import load_dotenv
load_dotenv('.env')
u = urlsplit(os.environ['DATABASE_URL'])
env = dict(os.environ, PGHOST=u.hostname, PGPORT=str(u.port or 5432),
           PGUSER=unquote(u.username or ''), PGPASSWORD=unquote(u.password or ''),
           PGDATABASE=unquote(u.path.lstrip('/')))
# pg_dump uses libpq to honor connection parameters, without putting credentials in argv.
env['PGDATABASE'] = os.environ['DATABASE_URL']
subprocess.run(['pg_dump', '--format=custom', '--file=' + sys.argv[1]], env=env, check=True)
PY
sudo -u ubuntu "$release/venv/bin/python" -c 'import database; database.database_setup()'
# Preflight imports and serves the expected frontend without sending mail or writing user data.
sudo -u ubuntu "$release/venv/bin/python" - <<'PY'
import app
client = app.app.test_client()
assert client.get('/').status_code == 200
assert client.get('/api/isloggedin').json['is_logged_in'] is False
PY
mkdir -p /etc/systemd/system/tiger-lift.service.d
cat > /etc/systemd/system/tiger-lift.service.d/deployment.conf <<CONF
[Service]
WorkingDirectory=$current/backend
ExecStart=
ExecStart=$current/venv/bin/gunicorn app:app -w 2 --bind 127.0.0.1:8100 --timeout 60 --log-file -
Environment=FLASK_ENV=production
CONF
switch_release() {
  ln -sfn "$1" "$current.next"
  mv -Tf "$current.next" "$current"
}
rollback() {
  echo "Health check failed; restoring $previous" >&2
  switch_release "$previous"
  systemctl restart tiger-lift.service
}
switch_release "$release"
systemctl daemon-reload
trap 'rollback; rm -f "$archive"' ERR
systemctl restart tiger-lift.service
healthy=false
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8100/ | cmp -s - "$release/frontend/dist/index.html" &&
     curl -fsS http://127.0.0.1:8100/api/isloggedin | python3 -c 'import json,sys; assert json.load(sys.stdin)["is_logged_in"] is False'; then
    healthy=true
    break
  fi
  sleep 2
done
[[ $healthy == true ]]
printf '%s\n' "$sha" > "$base/tiger-lift-deployed-sha"
trap - ERR
echo "Deployed TigerLift $sha"
