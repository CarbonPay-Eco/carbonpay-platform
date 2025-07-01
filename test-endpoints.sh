#!/bin/bash

# CarbonPay Backend API Testing Script
# Usage: ./test-endpoints.sh

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables to store tokens and IDs
JWT_TOKEN=""
USER_ID=""
PROJECT_ID=""
RETIREMENT_ID=""

echo -e "${YELLOW}🧪 Testando endpoints do CarbonPay Backend${NC}"
echo "=================================="

# Function to make HTTP requests and show results
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local description=$5
    
    echo -e "\n${YELLOW}📡 $description${NC}"
    echo "Request: $method $BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
    fi
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | grep HTTP_STATUS | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS ($http_code)${NC}"
    else
        echo -e "${RED}❌ FAILED ($http_code)${NC}"
    fi
    
    echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
    echo "---"
}

# 1. Test Health Check
test_endpoint "GET" "/api/health" "" "" "Health Check"

# 2. Test API Documentation
echo -e "\n${YELLOW}📚 API Documentation disponível em: $BASE_URL/api-docs${NC}"

# 3. Test User Registration
echo -e "\n${YELLOW}👤 USER ENDPOINTS${NC}"
USER_DATA='{
  "email": "test@carbonpay.com",
  "password": "password123",
  "onboardingData": {
    "fullName": "João Silva",
    "companyName": "EcoTech Solutions",
    "country": "Brazil",
    "industryType": "Technology",
    "companySize": "50-200",
    "tracksEmissions": true,
    "emissionSources": ["energy", "transportation"],
    "sustainabilityCertifications": ["ISO14001"],
    "priorOffsetting": true,
    "contactEmail": "joao@ecotech.com",
    "websiteUrl": "https://ecotech.com",
    "acceptedTerms": true
  }
}'

test_endpoint "POST" "/api/user/register" "$USER_DATA" "" "Registrar usuário com onboarding completo"

# Extract JWT token from response if available
if [ "$http_code" -eq 201 ]; then
    JWT_TOKEN=$(echo "$body" | jq -r '.data.token // empty')
    USER_ID=$(echo "$body" | jq -r '.data.user.id // empty')
    echo -e "${GREEN}🔑 JWT Token obtido: ${JWT_TOKEN:0:20}...${NC}"
fi

# 4. Test User Login
LOGIN_DATA='{"email": "test@carbonpay.com", "password": "password123"}'
test_endpoint "POST" "/api/user/login" "$LOGIN_DATA" "" "Login do usuário"

# Update token if login successful
if [ "$http_code" -eq 200 ]; then
    JWT_TOKEN=$(echo "$body" | jq -r '.data.token // empty')
    echo -e "${GREEN}🔑 JWT Token atualizado: ${JWT_TOKEN:0:20}...${NC}"
fi

# Only continue if we have a token
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ Não foi possível obter JWT token. Parando testes.${NC}"
    exit 1
fi

# 5. Test Get User Profile
test_endpoint "GET" "/api/user/profile" "" "Authorization: Bearer $JWT_TOKEN" "Obter perfil do usuário"

# 6. Test Add Balance (placeholder)
BALANCE_DATA='{"amount": 1000, "paymentMethod": "credit_card"}'
test_endpoint "POST" "/api/user/add-balance" "$BALANCE_DATA" "Authorization: Bearer $JWT_TOKEN" "Adicionar saldo à conta"

# 7. Admin Endpoints (Create Project)
echo -e "\n${YELLOW}👨‍💼 ADMIN ENDPOINTS${NC}"
PROJECT_DATA='{
  "projectName": "Amazon Rainforest Conservation",
  "location": "Amazon, Brazil", 
  "description": "Reforestation project in the Amazon rainforest",
  "certificationBody": "Verra",
  "projectRefId": "VCS-001-2023",
  "methodology": "VM0015",
  "verifierName": "TÜV SÜD",
  "vintageYear": 2023,
  "standard": "VCS",
  "totalIssued": 10000,
  "pricePerTon": 15.50,
  "ipfsHash": "QmTest123",
  "documentationUrl": "https://docs.carbonpay.com/project/001",
  "projectImageUrl": "https://images.carbonpay.com/amazon.jpg",
  "tags": ["forestry", "biodiversity", "community"]
}'

test_endpoint "POST" "/api/admin/projects" "$PROJECT_DATA" "Authorization: Bearer $JWT_TOKEN" "Criar projeto (Admin)"

# Extract project ID if successful
if [ "$http_code" -eq 201 ]; then
    PROJECT_ID=$(echo "$body" | jq -r '.data.id // empty')
    echo -e "${GREEN}🌱 Project ID obtido: $PROJECT_ID${NC}"
fi

# 8. Test Get All Projects
test_endpoint "GET" "/api/admin/projects" "" "Authorization: Bearer $JWT_TOKEN" "Listar todos os projetos (Admin)"

# 9. Test Get Project by ID (if we have a project ID)
if [ -n "$PROJECT_ID" ]; then
    test_endpoint "GET" "/api/admin/projects/$PROJECT_ID" "" "Authorization: Bearer $JWT_TOKEN" "Obter projeto por ID"
fi

# 10. Test Purchase Credits
echo -e "\n${YELLOW}💳 PURCHASE & RETIREMENT ENDPOINTS${NC}"
if [ -n "$PROJECT_ID" ]; then
    PURCHASE_DATA="{\"projectId\": \"$PROJECT_ID\", \"quantity\": 10}"
    test_endpoint "POST" "/api/user/purchase-credits" "$PURCHASE_DATA" "Authorization: Bearer $JWT_TOKEN" "Comprar créditos de carbono"
fi

# 11. Test Retire Credits
if [ -n "$PROJECT_ID" ]; then
    RETIRE_DATA='{
        "projectId": "'$PROJECT_ID'",
        "quantity": 5,
        "beneficiary": "EcoTech Solutions",
        "retirementMessage": "Offsetting company emissions for Q1 2024",
        "reportingPeriodStart": "2024-01-01",
        "reportingPeriodEnd": "2024-03-31"
    }'
    test_endpoint "POST" "/api/user/retire-emissions" "$RETIRE_DATA" "Authorization: Bearer $JWT_TOKEN" "Aposentar créditos (retirement)"
fi

# 12. Test Get User Retirements
test_endpoint "GET" "/api/user/retirements" "" "Authorization: Bearer $JWT_TOKEN" "Listar retirements do usuário"

# 13. Test Create Organization (Admin)
ORG_DATA='{
  "fullName": "Maria Santos",
  "companyName": "GreenTech Innovations",
  "country": "Brazil",
  "registrationNumber": "12.345.678/0001-90",
  "industryType": "Clean Technology",
  "companySize": "10-50",
  "description": "Sustainable technology solutions",
  "tracksEmissions": true,
  "emissionSources": ["energy", "transportation", "waste"],
  "sustainabilityCertifications": ["ISO14001", "B-Corp"],
  "priorOffsetting": false,
  "contactEmail": "maria@greentech.com",
  "websiteUrl": "https://greentech.com.br",
  "acceptedTerms": true
}'

test_endpoint "POST" "/api/admin/organizations" "$ORG_DATA" "Authorization: Bearer $JWT_TOKEN" "Criar organização (Admin)"

# 14. Test Get All Organizations
test_endpoint "GET" "/api/admin/organizations" "" "Authorization: Bearer $JWT_TOKEN" "Listar todas as organizações (Admin)"

echo -e "\n${GREEN}🎉 Teste de endpoints concluído!${NC}"
echo -e "${YELLOW}📝 Notas:${NC}"
echo "• Backend está rodando em: $BASE_URL"
echo "• Documentação Swagger: $BASE_URL/api-docs"
echo "• Para testar no navegador, acesse os endpoints GET diretamente"
echo "• Use o JWT token para autenticação: $JWT_TOKEN" 