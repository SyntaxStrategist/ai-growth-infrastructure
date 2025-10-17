#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║  🧪 AVENIR AI SOLUTIONS — END-TO-END TEST SUITE              ║
# ╚════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Base URL (development mode)
BASE_URL="http://localhost:3000"
API_BASE="http://localhost:3000/api"

# Test data
TIMESTAMP=$(date +%s)
TEST_CLIENT_EN_EMAIL="avenir-e2e-test-en-${TIMESTAMP}@example.com"
TEST_CLIENT_FR_EMAIL="avenir-e2e-test-fr-${TIMESTAMP}@example.com"
TEST_CLIENT_PASSWORD="TestPass123!"

# Storage for test IDs
EN_CLIENT_ID=""
FR_CLIENT_ID=""
EN_API_KEY=""
FR_API_KEY=""
EN_LEAD_ID=""
FR_LEAD_ID=""

# Output file
REPORT_FILE="tests/AVENIR_AI_SYSTEM_E2E_REPORT.md"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🧪 AVENIR AI SOLUTIONS — END-TO-END TEST SUITE              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Test Environment: DEVELOPMENT"
echo "Base URL: $BASE_URL"
echo "Start Time: $(date)"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 1: CLIENT SIGNUP (ENGLISH)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Client Signup (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/client/register" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "E2E Test Agency EN",
    "contactName": "Test User EN",
    "email": "'"$TEST_CLIENT_EN_EMAIL"'",
    "password": "'"$TEST_CLIENT_PASSWORD"'",
    "language": "en",
    "industryCategory": "Marketing",
    "primaryService": "Lead Generation",
    "bookingLink": "https://calendly.com/e2e-test",
    "customTagline": "Testing the future",
    "emailTone": "Friendly",
    "followupSpeed": "Instant"
  }')

echo "Response: $SIGNUP_RESPONSE"

if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ TEST 1 PASSED${NC}: Client signup successful (EN)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  # Extract client_id and api_key from response
  EN_CLIENT_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"clientId":"[^"]*"' | cut -d'"' -f4)
  EN_API_KEY=$(echo "$SIGNUP_RESPONSE" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
  
  echo "  Client ID: $EN_CLIENT_ID"
  echo "  API Key: ${EN_API_KEY:0:20}..."
else
  echo -e "${RED}❌ TEST 1 FAILED${NC}: Client signup failed (EN)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 2: CLIENT SIGNUP (FRENCH)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Client Signup (French)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SIGNUP_FR_RESPONSE=$(curl -s -X POST "$API_BASE/client/register" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Agence Test E2E FR",
    "contactName": "Utilisateur Test FR",
    "email": "'"$TEST_CLIENT_FR_EMAIL"'",
    "password": "'"$TEST_CLIENT_PASSWORD"'",
    "language": "fr",
    "industryCategory": "Construction",
    "primaryService": "Rénovation",
    "bookingLink": "https://calendly.com/e2e-test-fr",
    "customTagline": "L'avenir se construit aujourd'hui",
    "emailTone": "Professional",
    "followupSpeed": "Within 1 hour"
  }')

echo "Response: $SIGNUP_FR_RESPONSE"

if echo "$SIGNUP_FR_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ TEST 2 PASSED${NC}: Client signup successful (FR)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  FR_CLIENT_ID=$(echo "$SIGNUP_FR_RESPONSE" | grep -o '"clientId":"[^"]*"' | cut -d'"' -f4)
  FR_API_KEY=$(echo "$SIGNUP_FR_RESPONSE" | grep -o '"apiKey":"[^"]*"' | cut -d'"' -f4)
  
  echo "  Client ID: $FR_CLIENT_ID"
  echo "  API Key: ${FR_API_KEY:0:20}..."
else
  echo -e "${RED}❌ TEST 2 FAILED${NC}: Client signup failed (FR)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 3: CLIENT LOGIN (ENGLISH)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Client Login (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/client/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_CLIENT_EN_EMAIL"'",
    "password": "'"$TEST_CLIENT_PASSWORD"'"
  }')

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ TEST 3 PASSED${NC}: Client login successful (EN)"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ TEST 3 FAILED${NC}: Client login failed (EN)"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 4: LEAD SUBMISSION (ENGLISH) with API Key
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Lead Submission with API Key (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$EN_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  TEST 4 SKIPPED${NC}: No API key available from signup"
  WARNINGS=$((WARNINGS + 1))
else
  LEAD_RESPONSE=$(curl -s -X POST "$API_BASE/lead" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $EN_API_KEY" \
    -d '{
      "name": "John Doe",
      "email": "john.doe@example.com",
      "message": "I need urgent help with marketing automation for my business",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "locale": "en"
    }')

  echo "Response: $LEAD_RESPONSE"

  if echo "$LEAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ TEST 4 PASSED${NC}: Lead submitted successfully (EN)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    EN_LEAD_ID=$(echo "$LEAD_RESPONSE" | grep -o '"lead_id":"[^"]*"' | cut -d'"' -f4)
    echo "  Lead ID: $EN_LEAD_ID"
  else
    echo -e "${RED}❌ TEST 4 FAILED${NC}: Lead submission failed (EN)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 5: LEAD SUBMISSION (FRENCH) with API Key
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Lead Submission with API Key (French)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$FR_API_KEY" ]; then
  echo -e "${YELLOW}⚠️  TEST 5 SKIPPED${NC}: No API key available from signup"
  WARNINGS=$((WARNINGS + 1))
else
  LEAD_FR_RESPONSE=$(curl -s -X POST "$API_BASE/lead" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $FR_API_KEY" \
    -d '{
      "name": "Marie Dubois",
      "email": "marie.dubois@example.com",
      "message": "Besoin urgent d'automatisation pour notre équipe de vente",
      "timestamp": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",
      "locale": "fr"
    }')

  echo "Response: $LEAD_FR_RESPONSE"

  if echo "$LEAD_FR_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ TEST 5 PASSED${NC}: Lead submitted successfully (FR)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    FR_LEAD_ID=$(echo "$LEAD_FR_RESPONSE" | grep -o '"lead_id":"[^"]*"' | cut -d'"' -f4)
    echo "  Lead ID: $FR_LEAD_ID"
  else
    echo -e "${RED}❌ TEST 5 FAILED${NC}: Lead submission failed (FR)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 6: FETCH CLIENT LEADS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Fetch Client Leads"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$EN_CLIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  TEST 6 SKIPPED${NC}: No client ID available"
  WARNINGS=$((WARNINGS + 1))
else
  LEADS_RESPONSE=$(curl -s -X GET "$API_BASE/client/leads?clientId=$EN_CLIENT_ID")

  echo "Response: $LEADS_RESPONSE"

  if echo "$LEADS_RESPONSE" | grep -q '"success":true'; then
    LEAD_COUNT=$(echo "$LEADS_RESPONSE" | grep -o '"leads":\[' | wc -l)
    echo -e "${GREEN}✅ TEST 6 PASSED${NC}: Fetched client leads successfully"
    echo "  Lead count: $LEAD_COUNT"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ TEST 6 FAILED${NC}: Failed to fetch client leads"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 7: UPDATE CLIENT SETTINGS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Update Client Settings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$EN_CLIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  TEST 7 SKIPPED${NC}: No client ID available"
  WARNINGS=$((WARNINGS + 1))
else
  SETTINGS_RESPONSE=$(curl -s -X PUT "$API_BASE/client/settings?clientId=$EN_CLIENT_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "industryCategory": "Technology",
      "emailTone": "Professional",
      "customTagline": "Updated via E2E test"
    }')

  echo "Response: $SETTINGS_RESPONSE"

  if echo "$SETTINGS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ TEST 7 PASSED${NC}: Settings updated successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ TEST 7 FAILED${NC}: Settings update failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 8: PROSPECT INTELLIGENCE SCAN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Prospect Intelligence Scan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCAN_RESPONSE=$(curl -s -X POST "$API_BASE/prospect-intelligence/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "industries": ["Real Estate", "Legal"],
    "regions": ["Canada", "USA"],
    "minScore": 50,
    "maxResults": 5,
    "testMode": true
  }')

echo "Response: $SCAN_RESPONSE"

if echo "$SCAN_RESPONSE" | grep -q '"success":true'; then
  PROSPECT_COUNT=$(echo "$SCAN_RESPONSE" | grep -o '"discovered":[0-9]*' | grep -o '[0-9]*')
  echo -e "${GREEN}✅ TEST 8 PASSED${NC}: Prospect scan completed"
  echo "  Prospects discovered: $PROSPECT_COUNT"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ TEST 8 FAILED${NC}: Prospect scan failed"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 9: FETCH PROSPECTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 9: Fetch Prospect Candidates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROSPECTS_RESPONSE=$(curl -s -X GET "$API_BASE/prospect-intelligence/prospects")

echo "Response: $PROSPECTS_RESPONSE"

if echo "$PROSPECTS_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ TEST 9 PASSED${NC}: Prospects fetched successfully"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ TEST 9 FAILED${NC}: Failed to fetch prospects"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 10: CHAT ASSISTANT (Public Site)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 10: AI Chat Assistant"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CHAT_RESPONSE=$(curl -s -X POST "$API_BASE/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is Avenir AI?"}
    ]
  }')

echo "Response (truncated): ${CHAT_RESPONSE:0:200}..."

if echo "$CHAT_RESPONSE" | grep -q '"message"'; then
  echo -e "${GREEN}✅ TEST 10 PASSED${NC}: Chat assistant responded"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ TEST 10 FAILED${NC}: Chat assistant failed"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TEST 11: LANGUAGE PREFERENCE UPDATE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 11: Update Language Preference"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$EN_CLIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  TEST 11 SKIPPED${NC}: No client ID available"
  WARNINGS=$((WARNINGS + 1))
else
  LANG_RESPONSE=$(curl -s -X PUT "$API_BASE/client/update-language" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "'"$EN_CLIENT_ID"'",
      "language": "fr"
    }')

  echo "Response: $LANG_RESPONSE"

  if echo "$LANG_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ TEST 11 PASSED${NC}: Language updated successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ TEST 11 FAILED${NC}: Language update failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
fi

sleep 2

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FINAL SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📊 TEST SUITE COMPLETE                                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Test Summary:"
echo "  ✅ Tests Passed: $TESTS_PASSED"
echo "  ❌ Tests Failed: $TESTS_FAILED"
echo "  ⚠️  Warnings: $WARNINGS"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
  SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
  echo "  Success Rate: $SUCCESS_RATE%"
fi

echo ""
echo "End Time: $(date)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi

