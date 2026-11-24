#!/usr/bin/env bash
set -euo pipefail
image=${1:?image required}
name=aaapk-auth-smoke
export AUTH_USER=ci-test
export AUTH_PASSWORD=$(openssl rand -hex 24)
docker run -d --name "$name" -e AUTH_USER -e AUTH_PASSWORD -p 127.0.0.1:4173:4173 "$image"
trap 'docker logs "$name"; docker rm -f "$name"' EXIT
for i in $(seq 1 30); do
  if docker exec "$name" node /opt/hai-auth/health.mjs; then break; fi
  sleep 3
done
docker exec "$name" node /opt/hai-auth/health.mjs
for path in / /api/health /api/jobs /api/jobs/test/download; do
  test "$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:4173$path")" = 401
  test "$(curl -sS -u wrong:wrong -o /dev/null -w '%{http_code}' "http://127.0.0.1:4173$path")" = 401
done
curl -fsS --user "$AUTH_USER:$AUTH_PASSWORD" http://127.0.0.1:4173/ -o /dev/null
curl -fsS --user "$AUTH_USER:$AUTH_PASSWORD" http://127.0.0.1:4173/api/health
docker exec "$name" java -jar /app/tools/apktool.jar --version
docker exec "$name" java -jar /app/tools/apksigner.jar version
docker exec "$name" sh -c 'test -x /app/tools/zipalign && command -v keytool && command -v adb'
