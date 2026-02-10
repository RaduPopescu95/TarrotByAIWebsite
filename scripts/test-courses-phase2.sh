#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
DASHBOARD_TOKEN="${DASHBOARD_TOKEN:-{\"granted\":true,\"expiresAt\":4102444800000}}"

PASS_COUNT=0
FAIL_COUNT=0

RESP_STATUS=""
RESP_BODY=""

api_request() {
  local method="$1"
  local path="$2"
  local data="${3-}"
  local tmp_file
  local status
  tmp_file="$(mktemp)"

  if [[ -n "${data}" ]]; then
    if status="$(curl -sS -o "${tmp_file}" -w "%{http_code}" \
      -X "${method}" \
      "${BASE_URL}${path}" \
      -H "Content-Type: application/json" \
      -H "X-Dashboard-Access: ${DASHBOARD_TOKEN}" \
      --data "${data}")"; then
      RESP_STATUS="${status}"
    else
      RESP_STATUS="000"
    fi
  else
    if status="$(curl -sS -o "${tmp_file}" -w "%{http_code}" \
      -X "${method}" \
      "${BASE_URL}${path}" \
      -H "Content-Type: application/json" \
      -H "X-Dashboard-Access: ${DASHBOARD_TOKEN}")"; then
      RESP_STATUS="${status}"
    else
      RESP_STATUS="000"
    fi
  fi

  RESP_BODY="$(cat "${tmp_file}")"
  rm -f "${tmp_file}"
}

json_get_id() {
  printf "%s" "$1" | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d));
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(s);
        if (parsed && parsed.id) process.stdout.write(String(parsed.id));
      } catch (_) {}
    });
  '
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

echo "BASE_URL=${BASE_URL}"
echo

echo "1) PUT pe ID inexistent -> trebuie 404"
MISSING_COURSE_ID="missing-course-$(date +%s)"
api_request "PUT" "/api/admin/courses/${MISSING_COURSE_ID}" '{"title":"test update missing"}'
assert_status "404" "PUT /api/admin/courses/[inexistent]"
echo

echo "2) DELETE categorie folosita -> trebuie 409"
USED_CATEGORY_NAME="tmp-used-$(date +%s)"
api_request "POST" "/api/admin/course-categories" "{\"name\":\"${USED_CATEGORY_NAME}\"}"
USED_CATEGORY_ID="$(json_get_id "${RESP_BODY}")"

if [[ -z "${USED_CATEGORY_ID}" ]]; then
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "FAIL: nu am putut crea categoria pentru scenariul 2"
  echo "      status: ${RESP_STATUS}"
  echo "      body: ${RESP_BODY}"
else
  USED_COURSE_TITLE="tmp-course-uses-category-$(date +%s)"
  api_request "POST" "/api/admin/courses" "{
    \"title\":\"${USED_COURSE_TITLE}\",
    \"description\":\"temporary course for delete guard test\",
    \"vimeoUrl\":\"https://vimeo.com/123456789\",
    \"categoryIds\":[\"${USED_CATEGORY_ID}\"],
    \"price\":1,
    \"currency\":\"RON\",
    \"status\":\"draft\"
  }"
  USED_COURSE_ID="$(json_get_id "${RESP_BODY}")"

  if [[ -z "${USED_COURSE_ID}" ]]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "FAIL: nu am putut crea cursul pentru scenariul 2"
    echo "      status: ${RESP_STATUS}"
    echo "      body: ${RESP_BODY}"
  else
    api_request "DELETE" "/api/admin/course-categories/${USED_CATEGORY_ID}"
    assert_status "409" "DELETE /api/admin/course-categories/[used]"

    # Cleanup: remove course, then remove category.
    api_request "DELETE" "/api/admin/courses/${USED_COURSE_ID}"
    if [[ "${RESP_STATUS}" != "204" ]]; then
      echo "WARN: cleanup course delete returned ${RESP_STATUS} (${RESP_BODY})"
    fi

    api_request "DELETE" "/api/admin/course-categories/${USED_CATEGORY_ID}"
    if [[ "${RESP_STATUS}" != "204" ]]; then
      echo "WARN: cleanup category delete returned ${RESP_STATUS} (${RESP_BODY})"
    fi
  fi
fi
echo

echo "3) DELETE categorie libera -> trebuie 204"
FREE_CATEGORY_NAME="tmp-free-$(date +%s)"
api_request "POST" "/api/admin/course-categories" "{\"name\":\"${FREE_CATEGORY_NAME}\"}"
FREE_CATEGORY_ID="$(json_get_id "${RESP_BODY}")"

if [[ -z "${FREE_CATEGORY_ID}" ]]; then
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "FAIL: nu am putut crea categoria pentru scenariul 3"
  echo "      status: ${RESP_STATUS}"
  echo "      body: ${RESP_BODY}"
else
  api_request "DELETE" "/api/admin/course-categories/${FREE_CATEGORY_ID}"
  assert_status "204" "DELETE /api/admin/course-categories/[free]"
fi
echo

echo "Rezultat: ${PASS_COUNT} PASS, ${FAIL_COUNT} FAIL"
if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
exit 0
