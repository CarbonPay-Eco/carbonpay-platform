#!/bin/bash

# Quick Test Script for CarbonPay API
# Run individual commands to test endpoints

BASE_URL="http://localhost:3000"

echo "🧪 CarbonPay API Quick Tests"
echo "=================================="

echo ""
echo "1. 🔍 Health Check:"
echo "curl -s $BASE_URL/api/health | jq"
echo ""

echo "2. 📝 Register User:"
echo 'curl -X POST $BASE_URL/api/user/register \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "email": "test@carbonpay.com",
    "password": "password123",
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
  }'"'"
echo ""

echo "3. 🔐 Login:"
echo 'curl -X POST $BASE_URL/api/user/login \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"email": "test@carbonpay.com", "password": "password123"}'"'"
echo ""

echo "4. 👤 Get Profile (with token):"
echo 'curl -X GET $BASE_URL/api/user/profile \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"'
echo ""

echo "5. 🌱 Create Project (Admin):"
echo 'curl -X POST $BASE_URL/api/admin/projects \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \'
echo '  -d '"'"'{
    "projectName": "Amazon Conservation",
    "location": "Amazon, Brazil",
    "description": "Reforestation project",
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
    "tags": ["forestry", "biodiversity"]
  }'"'"
echo ""

echo "6. 📋 List Projects:"
echo 'curl -X GET $BASE_URL/api/admin/projects \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"'
echo ""

echo "7. 💳 Purchase Credits:"
echo 'curl -X POST $BASE_URL/api/user/purchase-credits \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \'
echo '  -d '"'"'{"projectId": "PROJECT_ID_HERE", "quantity": 10}'"'"
echo ""

echo "8. 🔥 Retire Credits:"
echo 'curl -X POST $BASE_URL/api/user/retire-emissions \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \'
echo '  -d '"'"'{
    "projectId": "PROJECT_ID_HERE",
    "quantity": 5,
    "beneficiary": "EcoTech Solutions",
    "retirementMessage": "Q1 2024 emissions offset",
    "reportingPeriodStart": "2024-01-01",
    "reportingPeriodEnd": "2024-03-31"
  }'"'"
echo ""

echo "9. 📊 List User Retirements:"
echo 'curl -X GET $BASE_URL/api/user/retirements \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"'
echo ""

echo "📚 Swagger Documentation:"
echo "Open in browser: $BASE_URL/api-docs"
echo "" 