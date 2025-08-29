#!/usr/bin/env bash

set -euo pipefail

# Sprint 2 E2E test script for CarbonPay backend
# - Registers an admin user
# - Logs in
# - Creates a project (requires admin + x-admin-approval)
# - Purchases credits
# - Retires credits
# - Verifies retirement (public endpoint)
# - Fetches certificate HTML/PDF
# - Exports CSVs
# - Checks /metrics

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_APPROVAL_HEADER_VALUE="approved-by-script"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo -e "${RED}Missing required command: $1${NC}" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

HTTP_CODE=""
HTTP_BODY=""

request() {
  local method="$1"; shift
  local endpoint="$1"; shift
  local data="${1:-}"; shift || true
  local -a headers=()
  if [[ $# -gt 0 ]]; then
    headers=("$@")
  fi

  echo -e "\n${YELLOW}${method} ${BASE_URL}${endpoint}${NC}"

  local curl_args=( -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" "${BASE_URL}${endpoint}" -H "Content-Type: application/json" )
  if [[ ${#headers[@]} -gt 0 ]]; then
    for h in "${headers[@]}"; do
      curl_args+=( -H "$h" )
    done
  fi
  if [[ -n "${data}" ]]; then
    curl_args+=( -d "$data" )
  fi

  local response
  response=$(curl "${curl_args[@]}") || true
  HTTP_CODE=$(echo "$response" | sed -n 's/.*HTTP_STATUS:\([0-9][0-9][0-9]\).*/\1/p')
  HTTP_BODY=$(echo "$response" | sed '/HTTP_STATUS:/d')

  if [[ -z "${HTTP_CODE}" ]]; then
    echo -e "${RED}No HTTP status captured${NC}"
    echo "$response"
    exit 1
  fi

  if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
    echo -e "${GREEN}✅ ${HTTP_CODE}${NC}"
  else
    echo -e "${RED}❌ ${HTTP_CODE}${NC}"
  fi
  echo "$HTTP_BODY" | jq . 2>/dev/null || echo "$HTTP_BODY"
}

echo -e "${YELLOW}Sprint 2 E2E tests against ${BASE_URL}${NC}"

# 1) Health
request GET "/api/health"

# 2) Register admin user
UNIQ=$(date +%s)
EMAIL="admin_${UNIQ}@carbonpay.local"
PASSWORD="password123"
REGISTER_PAYLOAD=$(jq -n --arg email "$EMAIL" --arg pass "$PASSWORD" '{
  email: $email,
  password: $pass,
  role: "admin",
  fullName: "Sprint2 Admin",
  companyName: "Sprint2 Co",
  country: "BR",
  industryType: "Tech",
  companySize: "1-10",
  tracksEmissions: true,
  emissionSources: ["energy"],
  sustainabilityCertifications: ["ISO14001"],
  priorOffsetting: false,
  contactEmail: $email,
  websiteUrl: "https://example.com",
  acceptedTerms: true
}')

request POST "/api/user/register" "$REGISTER_PAYLOAD"
TOKEN=$(echo "$HTTP_BODY" | jq -r '.data.token // empty')
USER_ID=$(echo "$HTTP_BODY" | jq -r '.data.user.id // empty')
if [[ -z "$TOKEN" || -z "$USER_ID" ]]; then
  echo -e "${RED}Registration failed or token missing${NC}"; exit 1
fi
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
echo -e "${GREEN}User: ${USER_ID}${NC}"

# 3) Login (to validate) and refresh token
LOGIN_PAYLOAD=$(jq -n --arg email "$EMAIL" --arg pass "$PASSWORD" '{email: $email, password: $pass}')
request POST "/api/user/login" "$LOGIN_PAYLOAD"
NEW_TOKEN=$(echo "$HTTP_BODY" | jq -r '.data.token // empty')
if [[ -n "$NEW_TOKEN" ]]; then TOKEN="$NEW_TOKEN"; AUTH_HEADER="Authorization: Bearer ${TOKEN}"; fi

# 4) Profile
request GET "/api/user/profile" "" "$AUTH_HEADER"

# 5) Create project (admin + approval header)
PROJECT_PAYLOAD='{
  "projectName": "Amazon Rainforest Conservation",
  "location": "Amazon, Brazil",
  "description": "Reforestation project in the Amazon",
  "certificationBody": "Verra",
  "projectRefId": "VCS-TEST-001",
  "methodology": "VM0015",
  "verifierName": "TUV SUD",
  "vintageYear": 2024,
  "standard": "VCS",
  "totalIssued": 10000,
  "pricePerCredit": 15.5,
  "pricePerTon": 15.5,
  "ipfsHash": "QmTest",
  "documentationUrl": "https://docs.example.com/project",
  "projectImageUrl": "https://images.example.com/amazon.jpg",
  "tags": ["forestry","biodiversity"]
}'
request POST "/api/admin/projects" "$PROJECT_PAYLOAD" "$AUTH_HEADER" "x-admin-approval: ${ADMIN_APPROVAL_HEADER_VALUE}"
PROJECT_ID=$(echo "$HTTP_BODY" | jq -r '.data.id // .data.tokenId // empty')
if [[ -z "$PROJECT_ID" ]]; then
  echo -e "${RED}Project creation failed${NC}"; exit 1
fi
echo -e "${GREEN}Project: ${PROJECT_ID}${NC}"

# 6) Purchase credits
PURCHASE_PAYLOAD=$(jq -n --arg pid "$PROJECT_ID" '{projectId: $pid, quantity: 10}')
request POST "/api/user/purchase-credits" "$PURCHASE_PAYLOAD" "$AUTH_HEADER"

# 7) Retire credits
RETIRE_PAYLOAD=$(jq -n --arg pid "$PROJECT_ID" '{
  projectId: $pid,
  quantity: 5,
  beneficiary: "Sprint2 Co",
  retirementMessage: "Sprint 2 E2E",
  reportingPeriodStart: "2024-01-01",
  reportingPeriodEnd: "2024-03-31"
}')
request POST "/api/user/retire-emissions" "$RETIRE_PAYLOAD" "$AUTH_HEADER"

# 8) List retirements and verify
request GET "/api/user/retirements" "" "$AUTH_HEADER"
RET_ID=$(echo "$HTTP_BODY" | jq -r '.data[0].id // empty')
RET_HASH=$(echo "$HTTP_BODY" | jq -r '.data[0].publicHash // empty')
if [[ -z "$RET_ID" ]]; then echo -e "${RED}No retirement found${NC}"; exit 1; fi

request GET "/api/verify?hash=${RET_HASH}"
request GET "/api/certificate/${RET_ID}.html"
# 8b) Certificate PDF (download to temp without parsing binary)
echo -e "\n${YELLOW}GET ${BASE_URL}/api/certificate/${RET_ID}.pdf${NC}"
PDF_STATUS=$(curl -s -o /tmp/certificate-${RET_ID}.pdf -w "HTTP_STATUS:%{http_code}\n" "${BASE_URL}/api/certificate/${RET_ID}.pdf" | tail -n1 | awk -F: '{print $2}')
if [[ "${PDF_STATUS}" -ge 200 && "${PDF_STATUS}" -lt 300 ]]; then
  echo -e "${GREEN}✅ ${PDF_STATUS}${NC} (saved to /tmp/certificate-${RET_ID}.pdf)"
else
  echo -e "${RED}❌ ${PDF_STATUS}${NC}"
fi

# 9) CSV exports
request GET "/api/user/retirements.csv" "" "$AUTH_HEADER"
request GET "/api/admin/purchases.csv" "" "$AUTH_HEADER"

# 10) Metrics
echo -e "\n${YELLOW}GET ${BASE_URL}/metrics (first 20 lines)${NC}"
curl -s "${BASE_URL}/metrics" | head -n 20
echo -e "\n${GREEN}All Sprint 2 tests finished.${NC}"


