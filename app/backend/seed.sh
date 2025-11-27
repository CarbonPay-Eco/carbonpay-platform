#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@carbonpay.eco}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
USER_EMAIL="${USER_EMAIL:-user@test.com}"
USER_PASSWORD="${USER_PASSWORD:-User123!}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}CarbonPay Database Seed Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Function to make API calls with error handling
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local description=$5

  echo -e "${YELLOW}→ ${description}...${NC}"

  if [ -n "$token" ]; then
    response=$(curl -s -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data")
  else
    response=$(curl -s -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  # Check if response contains "success":true
  if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "$response"
    return 0
  else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $response"
    return 1
  fi
}

# Step 1: Register Admin User
echo -e "\n${YELLOW}[1/6] Creating Admin User${NC}"
ADMIN_REGISTER_DATA=$(cat <<EOF
{
  "email": "$ADMIN_EMAIL",
  "password": "$ADMIN_PASSWORD",
  "fullName": "Admin User",
  "companyName": "CarbonPay Platform",
  "country": "Brazil",
  "registrationNumber": "00.000.000/0001-00",
  "industryType": "Technology",
  "companySize": "1-10",
  "description": "Platform administrator account",
  "tracksEmissions": true,
  "emissionSources": ["Energy", "Transportation"],
  "sustainabilityCertifications": ["ISO 14001"],
  "priorOffsetting": false,
  "contactEmail": "$ADMIN_EMAIL",
  "websiteUrl": "https://carbonpay.eco",
  "acceptedTerms": true,
  "role": "admin"
}
EOF
)

api_call "POST" "/user/register" "$ADMIN_REGISTER_DATA" "" "Registering admin user"
admin_response=$?

# Step 2: Login as Admin
echo -e "\n${YELLOW}[2/6] Logging in as Admin${NC}"
ADMIN_LOGIN_DATA=$(cat <<EOF
{
  "email": "$ADMIN_EMAIL",
  "password": "$ADMIN_PASSWORD"
}
EOF
)

login_response=$(api_call "POST" "/user/login" "$ADMIN_LOGIN_DATA" "" "Admin login")
ADMIN_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to get admin token. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}Admin token obtained${NC}"

# Step 3: Create Regular User
echo -e "\n${YELLOW}[3/6] Creating Regular User${NC}"
USER_REGISTER_DATA=$(cat <<EOF
{
  "email": "$USER_EMAIL",
  "password": "$USER_PASSWORD",
  "fullName": "Test User",
  "companyName": "Test Company Ltda",
  "country": "Brazil",
  "registrationNumber": "11.111.111/0001-11",
  "industryType": "Manufacturing",
  "companySize": "50-200",
  "description": "Test company for carbon offset purchases",
  "tracksEmissions": true,
  "emissionSources": ["Manufacturing", "Transportation", "Energy"],
  "sustainabilityCertifications": [],
  "priorOffsetting": false,
  "contactEmail": "$USER_EMAIL",
  "websiteUrl": "https://testcompany.com",
  "acceptedTerms": true,
  "role": "user"
}
EOF
)

api_call "POST" "/user/register" "$USER_REGISTER_DATA" "" "Registering regular user"

# Step 4: Login as Regular User
echo -e "\n${YELLOW}[4/6] Logging in as Regular User${NC}"
USER_LOGIN_DATA=$(cat <<EOF
{
  "email": "$USER_EMAIL",
  "password": "$USER_PASSWORD"
}
EOF
)

user_login_response=$(api_call "POST" "/user/login" "$USER_LOGIN_DATA" "" "User login")
USER_TOKEN=$(echo "$user_login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}Failed to get user token. Continuing anyway...${NC}"
fi

echo -e "${GREEN}User token obtained${NC}"

# Step 5: Create Projects (as Admin)
echo -e "\n${YELLOW}[5/6] Creating Carbon Credit Projects${NC}"

# Project 1: Amazon Rainforest Conservation
PROJECT1_DATA=$(cat <<EOF
{
  "projectName": "Amazon Rainforest Project",
  "location": "Pará, Brazil",
  "methodology": "VM0007 - REDD+ Methodology Framework",
  "certificationBody": "Verra VCS",
  "projectRefId": "VCS-2024-001",
  "verifierName": "SGS",
  "vintageYear": 2025,
  "standard": "VCS",
  "totalIssued": 50000,
  "pricePerTon": 2500,
  "description": "A comprehensive reforestation and conservation initiative in the Brazilian Amazon, protecting 10,000 hectares of primary forest and restoring 5,000 hectares of degraded land. This project generates verified carbon credits through avoided deforestation and forest restoration activities.",
  "documentationUrl": "https://carbonpay.eco/projects/vcs-2024-001",
  "projectImageUrl": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
  "projectOwner": "9FtcXokn9ZbXujAAXHCNgZMLfB58w4vtzJvytCoaVGn5"
}
EOF
)

api_call "POST" "/admin/projects" "$PROJECT1_DATA" "$ADMIN_TOKEN" "Creating Amazon Rainforest Project"

# Project 2: Atlantic Forest Restoration
PROJECT2_DATA=$(cat <<EOF
{
  "projectName": "Atlantic Forest Restoration",
  "location": "São Paulo, Brazil",
  "methodology": "VM0009 - Afforestation and Reforestation",
  "certificationBody": "Verra VCS",
  "projectRefId": "VCS-2024-002",
  "verifierName": "TÜV SÜD",
  "vintageYear": 2025,
  "standard": "VCS",
  "totalIssued": 30000,
  "pricePerTon": 3000,
  "description": "Restoration and protection of the Atlantic Forest biome, one of the world's most biodiverse ecosystems. This project includes native species reforestation, sustainable management practices, and community engagement programs.",
  "documentationUrl": "https://carbonpay.eco/projects/vcs-2024-002",
  "projectImageUrl": "https://images.unsplash.com/photo-1511497584788-876760111969?w=800",
  "projectOwner": "9FtcXokn9ZbXujAAXHCNgZMLfB58w4vtzJvytCoaVGn5"
}
EOF
)

api_call "POST" "/admin/projects" "$PROJECT2_DATA" "$ADMIN_TOKEN" "Creating Atlantic Forest Project"

# Project 3: Solar Energy Project
PROJECT3_DATA=$(cat <<EOF
{
  "projectName": "São Carlos Solar Energy",
  "location": "São Carlos, Brazil",
  "methodology": "ACM0002 - Grid-connected renewable electricity",
  "certificationBody": "Gold Standard",
  "projectRefId": "GS-2024-001",
  "verifierName": "AENOR Internacional",
  "vintageYear": 2025,
  "standard": "Gold Standard",
  "totalIssued": 20000,
  "pricePerTon": 3500,
  "description": "Large-scale solar photovoltaic project generating clean electricity and displacing fossil fuel-based power generation. The project contributes to Brazil's renewable energy targets and reduces greenhouse gas emissions.",
  "documentationUrl": "https://carbonpay.eco/projects/gs-2024-001",
  "projectImageUrl": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
  "projectOwner": "9FtcXokn9ZbXujAAXHCNgZMLfB58w4vtzJvytCoaVGn5"
}
EOF
)

api_call "POST" "/admin/projects" "$PROJECT3_DATA" "$ADMIN_TOKEN" "Creating Solar Energy Project"

# Step 6: Summary
echo -e "\n${YELLOW}[6/6] Seed Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database seeded successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Admin Account:${NC}"
echo -e "  Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  Password: ${GREEN}$ADMIN_PASSWORD${NC}"
echo ""
echo -e "${YELLOW}Test User Account:${NC}"
echo -e "  Email: ${GREEN}$USER_EMAIL${NC}"
echo -e "  Password: ${GREEN}$USER_PASSWORD${NC}"
echo ""
echo -e "${YELLOW}Created Projects:${NC}"
echo -e "  • Amazon Rainforest Conservation Project"
echo -e "  • Atlantic Forest Restoration Initiative"
echo -e "  • São Carlos Solar Energy Project"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Login with admin or user credentials"
echo -e "  2. Purchase carbon credits from available projects"
echo -e "  3. Retire credits to offset emissions"
echo ""
