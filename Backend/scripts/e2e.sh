#!/usr/bin/env bash
# DevOffice AI — End-to-End test script
#
# Phải chạy: 1) Go API ở :8080 (DEV_MODE=true, DEV_INPROCESS_WORKER=true)
#            2) jq installed (apt/choco install jq)
#
# Flow:
#   1. Signup user mới (Supabase Auth)
#   2. Grant 100 credits (dev endpoint)
#   3. List companies → pick first
#   4. Submit task
#   5. Poll status until completed
#   6. Fetch result signed URL
#   7. List events
#
set -euo pipefail

API="${API:-http://localhost:8080}"
SUPABASE_URL="${SUPABASE_URL:-https://kvdopoljxiffptrvjgmx.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?env SUPABASE_ANON_KEY required (Dashboard → Settings → API → anon key)}"

EMAIL="e2e-$(date +%s)@example.com"
PASSWORD="TestPass123!"

step() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✘ %s\033[0m\n" "$*" >&2; exit 1; }

step "1/7 signup user → $EMAIL"
SIGNUP=$(curl -s -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$SIGNUP" | jq -r '.access_token // empty')
[ -n "$TOKEN" ] || fail "signup failed: $SIGNUP"
echo "  token: ${TOKEN:0:24}..."

step "2/7 grant credits"
BAL=$(curl -s -X POST "$API/api/v1/credits/dev-grant" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":100}' | jq -r '.data.creditsBalance // .error.message')
[ "$BAL" -gt 0 ] 2>/dev/null || fail "grant failed: $BAL"
echo "  balance: $BAL"

step "3/7 list companies → pick first"
COMPANIES=$(curl -s "$API/api/v1/companies" -H "Authorization: Bearer $TOKEN")
COMPANY_ID=$(echo "$COMPANIES" | jq -r '.data.companies[0].id')
COMPANY_NAME=$(echo "$COMPANIES" | jq -r '.data.companies[0].name')
[ -n "$COMPANY_ID" ] && [ "$COMPANY_ID" != "null" ] || fail "list companies: $COMPANIES"
echo "  picked: $COMPANY_NAME ($COMPANY_ID)"

step "4/7 submit task"
TASK=$(curl -s -X POST "$API/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"companyId\":\"$COMPANY_ID\",\"brief\":\"e2e test: build a landing page hero section\"}")
TASK_ID=$(echo "$TASK" | jq -r '.data.id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || fail "submit failed: $TASK"
echo "  task: $TASK_ID"

step "5/7 poll until completed (timeout 60s)"
for i in $(seq 1 30); do
  STATUS=$(curl -s "$API/api/v1/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN" \
           | jq -r '.data.status')
  printf "  [%2ds] %s\n" $((i*2)) "$STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 2
done
[ "$STATUS" = "completed" ] || fail "task did not complete (final: $STATUS)"

step "6/7 fetch signed result URL"
RESULT=$(curl -s "$API/api/v1/tasks/$TASK_ID/result" -H "Authorization: Bearer $TOKEN")
RESULT_URL=$(echo "$RESULT" | jq -r '.data.resultUrl')
[ -n "$RESULT_URL" ] && [ "$RESULT_URL" != "null" ] || fail "no result url: $RESULT"
echo "  url: $RESULT_URL"

step "7/7 list events (count)"
EVENTS=$(curl -s "$API/api/v1/tasks/$TASK_ID/events" -H "Authorization: Bearer $TOKEN")
COUNT=$(echo "$EVENTS" | jq -r '.data.items | length')
echo "  events: $COUNT"
echo "$EVENTS" | jq -r '.data.items[] | "    \(.createdAt | sub("\\.[0-9]+";"")) \(.eventType) \(.agentId // "-")"'

printf "\n\033[1;32m✔ E2E PASS\033[0m  task=$TASK_ID  events=$COUNT  balance=$BAL → final\n"
