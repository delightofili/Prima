#!/usr/bin/env bash
# Checks that Prima is up:   bash scripts/uptime.sh
# The addresses can be changed for a test:  UPTIME_APP=... UPTIME_LANDING=... bash scripts/uptime.sh
# Exit 0 = everything answers. Exit 1 = something is wrong, and the reason is printed (GitHub then emails the owner).
set -u
app="${UPTIME_APP:-https://app.primahealth.com.ng}"
landing="${UPTIME_LANDING:-https://primahealth.com.ng}"
tries="${UPTIME_TRIES:-3}"       # a single bad answer is often a blip, so ask again before raising the alarm
pause="${UPTIME_PAUSE:-20}"      # seconds between tries
limit="${UPTIME_LIMIT:-20}"      # seconds to wait for one answer; a site this slow is down for a nurse on a poor connection
failures=()

# check LABEL URL WORD: the address answers 200, within the time limit, and the page contains WORD
check() {
  local label="$1" url="$2" word="$3" n=1 code body why=""
  while [ "$n" -le "$tries" ]; do
    body="$(mktemp)"
    code="$(curl -s -o "$body" -w '%{http_code}' --max-time "$limit" -L --max-redirs 3 "$url" 2>/dev/null)"
    code="${code:-000}"
    if [ "$code" = "200" ] && grep -q -- "$word" "$body"; then rm -f "$body"; echo "OK    $label ($url)"; return 0; fi
    if [ "$code" = "000" ]; then why="no answer within ${limit}s (or no connection)"
    elif [ "$code" != "200" ]; then why="answered HTTP $code, not 200"
    else why="answered 200 but the page does not contain \"$word\""; fi
    rm -f "$body"
    echo "try $n of $tries: $label: $why"
    n=$((n + 1)); [ "$n" -le "$tries" ] && sleep "$pause"
  done
  failures+=("$label ($url): $why")
  return 1
}

# the app's front page, the file that says which build is live, and the website
check "the app opens" "$app/" "Prima"
check "the app's version file answers" "$app/version.json" '"build"'
check "the website opens" "$landing/" "Prima"

if [ "${#failures[@]}" -gt 0 ]; then
  echo
  echo "PRIMA IS NOT FULLY UP:"
  for f in "${failures[@]}"; do echo "  - $f"; echo "::error::$f"; done
  exit 1
fi
echo "Everything answers."