#!/bin/bash

echo "🧪 ============================================"
echo "🧪 Avenir AI Solutions — E2E Test Suite"
echo "🧪 Client Onboarding & Dashboard System"
echo "🧪 Production Domain Testing"
echo "🧪 ============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Base URL - Production domain
BASE_URL="https://www.aveniraisolutions.ca"

echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${CYAN}🌐 Testing Environment (Production)${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "   Base Domain:    ${BASE_URL}"
echo "   API Endpoints:  ${BASE_URL}/api/*"
echo "   EN Signup:      ${BASE_URL}/en/client/signup"
echo "   EN Dashboard:   ${BASE_URL}/en/client/dashboard"
echo "   EN API Access:  ${BASE_URL}/en/client/api-access"
echo "   FR Signup:      ${BASE_URL}/fr/client/signup"
echo "   FR Dashboard:   ${BASE_URL}/fr/client/dashboard"
echo "   FR API Access:  ${BASE_URL}/fr/client/api-access"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test data
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-client-${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User ${TIMESTAMP}"
TEST_BUSINESS="Test Company ${TIMESTAMP}"

# Results
PASSED=0
FAILED=0
TOTAL=0

# Store credentials
API_KEY=""
CLIENT_ID=""

run_test() {
    local test_name=$1
    local test_command=$2
    
    TOTAL=$((TOTAL + 1))
    echo ""
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${BLUE}TEST ${TOTAL}: ${test_name}${NC}"
    echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if eval "$test_command"; then
        echo "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "${YELLOW}📋 Test Configuration:${NC}"
echo "   Name: ${TEST_NAME}"
echo "   Email: ${TEST_EMAIL}"
echo "   Business: ${TEST_BUSINESS}"
echo "   Password: ${TEST_PASSWORD}"
echo ""

# Test 1: Client Registration (English)
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Step 1: Client Registration (EN)${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Endpoint: POST ${BASE_URL}/api/client/register${NC}"
echo "${YELLOW}[E2E-Test] Sending registration request...${NC}"
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/client/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"name\": \"${TEST_NAME}\",
    \"email\": \"${TEST_EMAIL}\",
    \"business_name\": \"${TEST_BUSINESS}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"language\": \"en\"
  }")

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_STATUS/d')

echo "${YELLOW}[E2E-Test] Registration response status: ${HTTP_STATUS}${NC}"
echo "${YELLOW}[E2E-Test] Registration response body: ${REGISTER_BODY}${NC}"

run_test "Client Registration (EN)" "
echo '${REGISTER_BODY}' | jq -e '.success == true'
"

# Test 2: Get credentials and verify
echo ""
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Step 2: Client Authentication (EN)${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Endpoint: POST ${BASE_URL}/api/client/auth${NC}"
echo "${YELLOW}[E2E-Test] Attempting login to verify registration...${NC}"

AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/api/client/auth" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

AUTH_HTTP_STATUS=$(echo "$AUTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | sed '/HTTP_STATUS/d')

echo "${YELLOW}[E2E-Test] Auth response status: ${AUTH_HTTP_STATUS}${NC}"
echo "${YELLOW}[E2E-Test] Auth response body: ${AUTH_BODY}${NC}"

API_KEY=$(echo "$AUTH_BODY" | jq -r '.data.apiKey // empty')
CLIENT_ID=$(echo "$AUTH_BODY" | jq -r '.data.clientId // empty')

run_test "Client Authentication & Credentials" "
echo '${AUTH_BODY}' | jq -e '.success == true and .data.apiKey != null and .data.clientId != null'
"

echo ""
echo "${YELLOW}🔑 Retrieved Credentials:${NC}"
echo "   API Key: ${API_KEY:0:25}..."
echo "   Client ID: ${CLIENT_ID}"

# Test 3: Fetch initial leads (should be empty)
echo ""
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Step 3: Fetch Initial Client Leads${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -z "$CLIENT_ID" ]; then
    echo "${YELLOW}[E2E-Test] Endpoint: GET ${BASE_URL}/api/client/leads?clientId=<missing>&locale=en${NC}"
    echo "${RED}❌ No CLIENT_ID available, skipping lead fetch tests${NC}"
    FAILED=$((FAILED + 3))
    TOTAL=$((TOTAL + 3))
else
    echo "${YELLOW}[E2E-Test] Endpoint: GET ${BASE_URL}/api/client/leads?clientId=${CLIENT_ID}&locale=en${NC}"
    echo "${YELLOW}[E2E-Test] Fetching initial client leads...${NC}"
    
    LEADS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/api/client/leads?clientId=${CLIENT_ID}&locale=en")
    
    LEADS_HTTP_STATUS=$(echo "$LEADS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    LEADS_BODY=$(echo "$LEADS_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "${YELLOW}[E2E-Test] Leads fetch status: ${LEADS_HTTP_STATUS}${NC}"
    echo "${YELLOW}[E2E-Test] Leads fetch body: ${LEADS_BODY}${NC}"
    
    run_test "Fetch Initial Client Leads" "
    echo '${LEADS_BODY}' | jq -e '.success == true and (.data | length) == 0'
    "
    
    # Test 4: Send lead via API
    echo ""
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}[E2E-Test] Step 4: Send Lead via API${NC}"
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}[E2E-Test] Endpoint: POST ${BASE_URL}/api/lead${NC}"
    echo "${YELLOW}[E2E-Test] Using API Key: ${API_KEY:0:25}...${NC}"
    echo "${YELLOW}[E2E-Test] Sending test lead via API...${NC}"
    
    LEAD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/lead" \
      -H 'Content-Type: application/json' \
      -H "x-api-key: ${API_KEY}" \
      -d "{
        \"name\": \"Test Lead User\",
        \"email\": \"testlead@example.com\",
        \"message\": \"I am interested in your AI solutions for business growth\",
        \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
      }")
    
    LEAD_HTTP_STATUS=$(echo "$LEAD_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    LEAD_BODY=$(echo "$LEAD_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "${YELLOW}[E2E-Test] Lead submission status: ${LEAD_HTTP_STATUS}${NC}"
    echo "${YELLOW}[E2E-Test] Lead submission body: ${LEAD_BODY}${NC}"
    
    run_test "Send Lead via API" "
    echo '${LEAD_BODY}' | jq -e '.success == true'
    "
    
    # Wait for AI processing
    echo ""
    echo "${YELLOW}⏳ Waiting 5 seconds for AI enrichment...${NC}"
    sleep 5
    
    # Test 5: Verify lead appears
    echo ""
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}[E2E-Test] Step 5: Verify Lead in Client Dashboard${NC}"
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${YELLOW}[E2E-Test] Endpoint: GET ${BASE_URL}/api/client/leads?clientId=${CLIENT_ID}&locale=en${NC}"
    echo "${YELLOW}[E2E-Test] Verifying lead in client dashboard...${NC}"
    
    VERIFY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/api/client/leads?clientId=${CLIENT_ID}&locale=en")
    VERIFY_HTTP_STATUS=$(echo "$VERIFY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "${YELLOW}[E2E-Test] Verify leads status: ${VERIFY_HTTP_STATUS}${NC}"
    echo "${YELLOW}[E2E-Test] Verify leads body: ${VERIFY_BODY}${NC}"
    
    LEAD_COUNT=$(echo "$VERIFY_BODY" | jq '.data | length' 2>/dev/null || echo "0")
    echo "   Leads found: ${LEAD_COUNT}"
    
    run_test "Verify Lead in Client Dashboard" "
    [ \"${LEAD_COUNT}\" -gt 0 ]
    "
fi

# Test 6: French registration
echo ""
TEST_EMAIL_FR="test-client-fr-${TIMESTAMP}@example.com"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Step 6: Client Registration (FR)${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Endpoint: POST ${BASE_URL}/api/client/register${NC}"
echo "${YELLOW}[E2E-Test] Testing French registration...${NC}"

FR_REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/client/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"name\": \"Marie Dubois\",
    \"email\": \"${TEST_EMAIL_FR}\",
    \"business_name\": \"Entreprise Test ${TIMESTAMP}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"language\": \"fr\"
  }")

FR_HTTP_STATUS=$(echo "$FR_REGISTER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
FR_BODY=$(echo "$FR_REGISTER_RESPONSE" | sed '/HTTP_STATUS/d')

echo "${YELLOW}[E2E-Test] FR registration status: ${FR_HTTP_STATUS}${NC}"
echo "${YELLOW}[E2E-Test] FR registration body: ${FR_BODY}${NC}"

run_test "Client Registration (FR)" "
echo '${FR_BODY}' | jq -e '.success == true'
"

# Test 7: French auth
echo ""
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Step 7: Client Authentication (FR)${NC}"
echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${YELLOW}[E2E-Test] Endpoint: POST ${BASE_URL}/api/client/auth${NC}"
echo "${YELLOW}[E2E-Test] Testing French authentication...${NC}"

FR_AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/api/client/auth" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"${TEST_EMAIL_FR}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

FR_AUTH_HTTP_STATUS=$(echo "$FR_AUTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
FR_AUTH_BODY=$(echo "$FR_AUTH_RESPONSE" | sed '/HTTP_STATUS/d')

echo "${YELLOW}[E2E-Test] FR auth status: ${FR_AUTH_HTTP_STATUS}${NC}"
echo "${YELLOW}[E2E-Test] FR auth body: ${FR_AUTH_BODY}${NC}"

run_test "Client Authentication (FR)" "
echo '${FR_AUTH_BODY}' | jq -e '.success == true and .data.language == \"fr\"'
"

# Test 8: Logo file
run_test "Verify Logo File Exists" "
[ -f 'public/assets/logos/logo.svg' ]
"

# Final Results
echo ""
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🎯 E2E Test Results${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   Total Tests: ${TOTAL}"
echo "   ${GREEN}Passed: ${PASSED}${NC}"
echo "   ${RED}Failed: ${FAILED}${NC}"
echo ""

if [ ${FAILED} -eq 0 ]; then
    echo "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo "🎉 Client onboarding system is fully functional!"
    exit 0
else
    echo "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "⚠️  Please review the failed tests above"
    exit 1
fi
