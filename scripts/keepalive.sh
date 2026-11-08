#!/usr/bin/env bash
# Keeps ONE Supabase project awake by calling its keepalive() function.
#   bash scripts/keepalive.sh LABEL URL_SECRET_NAME KEY_SECRET_NAME [--optional]
# The values arrive as the environment variables SUPABASE_URL and SUPABASE_KEY (the workflow fills them from the secrets).
# --optional: if both secrets are empty, warn and succeed. Used for production until its secrets exist.
set -u
label="${1:?missing label}"
url_name="${2:?missing the name of the URL secret}"
key_name="${3:?missing the name of the key secret}"
optional="${4:-}"

# 1. Tidy what was pasted into the secrets. A stray space, a line break or a final slash is the usual reason for "malformed URL".
SUPABASE_URL="$(printf '%s' "${SUPABASE_URL:-}" | tr -d '[:space:]')"
SUPABASE_URL="${SUPABASE_URL%/}"
SUPABASE_KEY="$(printf '%s' "${SUPABASE_KEY:-}" | tr -d '[:space:]')"

# 2. Say clearly what is wrong, before calling anything
if [ "$optional" = "--optional" ] && [ -z "$SUPABASE_URL" ] && [ -z "$SUPABASE_KEY" ]; then
  echo "::warning::The $label project is NOT being kept awake: the $url_name and $key_name secrets are not set yet."
  echo "Add them when the $label project exists (repo > Settings > Secrets and variables > Actions). Skipping."
  exit 0
fi
if [ -z "$SUPABASE_URL" ]; then
  echo "[$label] The $url_name secret is empty or does not exist."
  echo "Add it: repo > Settings > Secrets and variables > Actions > New repository secret. Name: $url_name"
  exit 1
fi
case "$SUPABASE_URL" in
  https://*.supabase.co) ;;
  *)
    echo "[$label] $url_name does not look right. It should look like https://abcdefgh.supabase.co (starting with https://)."
    exit 1
    ;;
esac
if [ -z "$SUPABASE_KEY" ]; then
  echo "[$label] The $key_name secret is empty or does not exist."
  echo "Add it: repo > Settings > Secrets and variables > Actions > New repository secret. Name: $key_name"
  exit 1
fi
echo "[$label] Calling $SUPABASE_URL (key present, ${#SUPABASE_KEY} characters)"

# 3. Call the database. A temporary hiccup gets more tries; a problem that cannot fix itself stops at once.
url="$SUPABASE_URL/rest/v1/rpc/keepalive"
tries=5
for attempt in $(seq 1 "$tries"); do
  rc=0
  code=$(curl -sS --max-time 30 -o response.txt -w "%{http_code}" -X POST "$url" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d '{}') || rc=$?
  if [ "$rc" -ne 0 ]; then code="000"; fi
  echo "[$label] Try $attempt of $tries: HTTP $code (curl exit $rc)"
  if [ "$code" = "200" ]; then
    cat response.txt
    echo
    echo "[$label] The database answered. It will not pause."
    exit 0
  fi
  cat response.txt 2>/dev/null || true
  echo
  if [ "$rc" = "3" ]; then
    echo "[$label] The web address is malformed. Check the $url_name secret."
    exit 1
  fi
  if [ "$code" = "401" ] || [ "$code" = "403" ] || [ "$code" = "404" ]; then
    echo "[$label] This will not fix itself by waiting: check the $key_name secret, and that the keepalive function exists in this project (it is in supabase/schema.sql)."
    exit 1
  fi
  if [ "$attempt" -lt "$tries" ]; then
    echo "[$label] Waiting $((attempt * 20)) seconds before trying again..."
    sleep $((attempt * 20))
  fi
done
echo "[$label] Still no answer after $tries tries. Open the Supabase dashboard: the project may be paused."
exit 1