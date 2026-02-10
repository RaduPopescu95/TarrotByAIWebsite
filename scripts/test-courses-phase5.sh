#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
DASHBOARD_TOKEN="${DASHBOARD_TOKEN:-{\"granted\":true,\"expiresAt\":4102444800000}}"

PUBLISHED_COURSE_ID="${PUBLISHED_COURSE_ID:-}"
DRAFT_COURSE_ID="${DRAFT_COURSE_ID:-}"
SCHEDULED_FUTURE_COURSE_ID="${SCHEDULED_FUTURE_COURSE_ID:-}"
SCHEDULED_PAST_COURSE_ID="${SCHEDULED_PAST_COURSE_ID:-}"
ENTITLEMENT_COURSE_ID="${ENTITLEMENT_COURSE_ID:-}"
DEPUBLISHED_PAID_COURSE_ID="${DEPUBLISHED_PAID_COURSE_ID:-}"

PAID_AUTH_TOKEN="${PAID_AUTH_TOKEN:-}"
UNPAID_AUTH_TOKEN="${UNPAID_AUTH_TOKEN:-}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

RESP_STATUS=""
RESP_BODY=""

api_request() {
  local method="$1"
  local path="$2"
  local data="${3-}"
  local auth_token="${4-}"
  local use_dashboard="${5-0}"
  local tmp_file
  local status
  local -a cmd

  tmp_file="$(mktemp)"
  cmd=(curl -sS -o "${tmp_file}" -w "%{http_code}" -X "${method}" "${BASE_URL}${path}" -H "Content-Type: application/json")

  if [[ -n "${auth_token}" ]]; then
    cmd+=(-H "Authorization: Bearer ${auth_token}")
  fi

  if [[ "${use_dashboard}" == "1" ]]; then
    cmd+=(-H "X-Dashboard-Access: ${DASHBOARD_TOKEN}")
  fi

  if [[ -n "${data}" ]]; then
    cmd+=(--data "${data}")
  fi

  if status="$("${cmd[@]}")"; then
    RESP_STATUS="${status}"
  else
    RESP_STATUS="000"
  fi

  RESP_BODY="$(cat "${tmp_file}")"
  rm -f "${tmp_file}"
}

assert_status() {
  local expected="$1"
  local label="$2"
  if [[ "${RESP_STATUS}" == "${expected}" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "PASS: ${label} (status ${RESP_STATUS})"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "FAIL: ${label} (expected ${expected}, got ${RESP_STATUS})"
    echo "      body: ${RESP_BODY}"
  fi
}

skip_case() {
  local label="$1"
  local reason="$2"
  SKIP_COUNT=$((SKIP_COUNT + 1))
  echo "SKIP: ${label} (${reason})"
}

json_field_bool() {
  local json="$1"
  local field="$2"
  printf "%s" "${json}" | node -e '
    let s = "";
    const key = process.argv[1];
    process.stdin.on("data", (d) => (s += d));
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(s);
        const value = parsed?.[key];
        process.stdout.write(String(Boolean(value)));
      } catch (_) {
        process.stdout.write("false");
      }
    });
  ' "${field}"
}

assert_json_bool_field() {
  local field="$1"
  local expected="$2"
  local label="$3"
  local actual
  actual="$(json_field_bool "${RESP_BODY}" "${field}")"
  if [[ "${actual}" == "${expected}" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "PASS: ${label} (${field}=${actual})"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "FAIL: ${label} (expected ${field}=${expected}, got ${actual})"
    echo "      body: ${RESP_BODY}"
  fi
}

echo "BASE_URL=${BASE_URL}"
echo

echo "0) Preflight API"
api_request "GET" "/api/courses"
if [[ "${RESP_STATUS}" != "200" ]]; then
  echo "FAIL: serverul nu raspunde corect pe ${BASE_URL}/api/courses (status ${RESP_STATUS})"
  echo "      body: ${RESP_BODY}"
  echo
  echo "Porneste app-ul local cu: npm run dev"
  exit 2
fi
echo "PASS: API disponibil"
echo

echo "1) Public list endpoint -> 200"
assert_status "200" "GET /api/courses"
echo

echo "2) Checkout fara auth -> 401"
CHECKOUT_TEST_COURSE_ID="${PUBLISHED_COURSE_ID:-dummy-course-id}"
api_request "POST" "/api/stripe/courses/create-checkout-session" "{\"courseId\":\"${CHECKOUT_TEST_COURSE_ID}\"}"
assert_status "401" "POST /api/stripe/courses/create-checkout-session (no auth)"
echo

echo "3) Webhook fara stripe-signature -> 400"
api_request "POST" "/api/stripe/courses/webhook" "{}"
assert_status "400" "POST /api/stripe/courses/webhook (missing signature)"
echo

echo "4) Draft hidden -> 404"
if [[ -n "${DRAFT_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${DRAFT_COURSE_ID}"
  assert_status "404" "GET /api/courses/[draft]"
else
  skip_case "GET /api/courses/[draft]" "DRAFT_COURSE_ID lipsa"
fi
echo

echo "5) Published visible -> 200"
if [[ -n "${PUBLISHED_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${PUBLISHED_COURSE_ID}"
  assert_status "200" "GET /api/courses/[published]"
else
  skip_case "GET /api/courses/[published]" "PUBLISHED_COURSE_ID lipsa"
fi
echo

echo "6) Scheduled future hidden -> 404"
if [[ -n "${SCHEDULED_FUTURE_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${SCHEDULED_FUTURE_COURSE_ID}"
  assert_status "404" "GET /api/courses/[scheduled-future]"
else
  skip_case "GET /api/courses/[scheduled-future]" "SCHEDULED_FUTURE_COURSE_ID lipsa"
fi
echo

echo "7) Scheduled past visible -> 200"
if [[ -n "${SCHEDULED_PAST_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${SCHEDULED_PAST_COURSE_ID}"
  assert_status "200" "GET /api/courses/[scheduled-past]"
else
  skip_case "GET /api/courses/[scheduled-past]" "SCHEDULED_PAST_COURSE_ID lipsa"
fi
echo

echo "8) Entitlement unpaid playback -> 403"
if [[ -n "${UNPAID_AUTH_TOKEN}" && -n "${ENTITLEMENT_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${ENTITLEMENT_COURSE_ID}/playback" "" "${UNPAID_AUTH_TOKEN}"
  assert_status "403" "GET /api/courses/[id]/playback (unpaid)"
else
  skip_case "GET /api/courses/[id]/playback (unpaid)" "UNPAID_AUTH_TOKEN sau ENTITLEMENT_COURSE_ID lipsa"
fi
echo

echo "9) Entitlement paid playback -> 200"
if [[ -n "${PAID_AUTH_TOKEN}" && -n "${ENTITLEMENT_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${ENTITLEMENT_COURSE_ID}/playback" "" "${PAID_AUTH_TOKEN}"
  assert_status "200" "GET /api/courses/[id]/playback (paid)"
else
  skip_case "GET /api/courses/[id]/playback (paid)" "PAID_AUTH_TOKEN sau ENTITLEMENT_COURSE_ID lipsa"
fi
echo

echo "10) Depublished after purchase -> detail 200 + hasAccess=true"
if [[ -n "${PAID_AUTH_TOKEN}" && -n "${DEPUBLISHED_PAID_COURSE_ID}" ]]; then
  api_request "GET" "/api/courses/${DEPUBLISHED_PAID_COURSE_ID}" "" "${PAID_AUTH_TOKEN}"
  assert_status "200" "GET /api/courses/[depublished-paid]"
  if [[ "${RESP_STATUS}" == "200" ]]; then
    assert_json_bool_field "hasAccess" "true" "hasAccess pentru curs depublicat"
  fi
else
  skip_case "GET /api/courses/[depublished-paid]" "PAID_AUTH_TOKEN sau DEPUBLISHED_PAID_COURSE_ID lipsa"
fi
echo

echo "11) Category delete guard regression (folosita vs libera)"
if [[ -n "${DASHBOARD_TOKEN}" && -x "./scripts/test-courses-phase2.sh" ]]; then
  if BASE_URL="${BASE_URL}" DASHBOARD_TOKEN="${DASHBOARD_TOKEN}" ./scripts/test-courses-phase2.sh >/tmp/phase5_phase2_check.log 2>&1; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "PASS: category delete guard (phase2 regression)"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "FAIL: category delete guard (phase2 regression)"
    echo "      detalii:"
    tail -n 20 /tmp/phase5_phase2_check.log
  fi
  rm -f /tmp/phase5_phase2_check.log
else
  skip_case "category delete guard regression" "DASHBOARD_TOKEN lipsa sau scripts/test-courses-phase2.sh inexistent"
fi
echo

echo "Rezultat: ${PASS_COUNT} PASS, ${FAIL_COUNT} FAIL, ${SKIP_COUNT} SKIP"
if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
exit 0
