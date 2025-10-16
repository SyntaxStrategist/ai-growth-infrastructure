#!/bin/bash

# ============================================
# is_test Flag Regression Test
# ============================================
# Tests that test data is correctly isolated from production data
#
# PREREQUISITES:
# 1. Start dev server in another terminal: npm run dev
# 2. Ensure .env.local has Supabase credentials
# 3. Gmail sending will be skipped in development mode
#
# USAGE:
#   ./tests/test-is-test-flag-regression.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"
TEST_SUFFIX=$(date +%s)
TEST_RESULTS=()

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         is_test Flag Regression Test (Local)                  ║${NC}"
echo -e "${BLUE}║         Testing Test Data Isolation                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Test Suffix: $TEST_SUFFIX"
echo ""

# Check if dev server is running
echo "🔍 Checking if dev server is running..."
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" || echo "000")

if [ "$SERVER_CHECK" = "000" ] || [ "$SERVER_CHECK" = "502" ]; then
    echo -e "${RED}❌ Dev server not running at $BASE_URL${NC}"
    echo ""
    echo "Please start the dev server first:"
    echo "  npm run dev"
    echo ""
    echo "Then run this test again."
    exit 1
else
    echo -e "${GREEN}✅ Dev server is running (HTTP $SERVER_CHECK)${NC}"
    echo ""
fi

sleep 1


# Helper function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} | $test_name"
        TEST_RESULTS+=("PASS|$test_name|$details")
    else
        echo -e "${RED}❌ FAIL${NC} | $test_name"
        TEST_RESULTS+=("FAIL|$test_name|$details")
    fi
    
    if [ -n "$details" ]; then
        echo "   Details: $details"
    fi
    echo ""
}

# ============================================
# PHASE 1: Create Test Client
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 1: Create Test Client (example.com email)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_CLIENT_EMAIL="test-client-${TEST_SUFFIX}@example.com"

TEST_CLIENT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_URL/client/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"businessName\": \"Test Company ${TEST_SUFFIX}\",
        \"contactName\": \"Test User\",
        \"email\": \"${TEST_CLIENT_EMAIL}\",
        \"password\": \"TestPassword123!\",
        \"language\": \"en\"
    }")

HTTP_STATUS_TEST=$(echo "$TEST_CLIENT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
TEST_CLIENT_BODY=$(echo "$TEST_CLIENT_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_TEST"
echo "Response: $TEST_CLIENT_BODY"

if [ "$HTTP_STATUS_TEST" = "200" ] || [ "$HTTP_STATUS_TEST" = "201" ]; then
    TEST_CLIENT_ID=$(echo "$TEST_CLIENT_BODY" | jq -r '.data.clientId // empty')
    TEST_API_KEY=$(echo "$TEST_CLIENT_BODY" | jq -r '.data.apiKey // empty')
    
    if [ -n "$TEST_CLIENT_ID" ]; then
        log_test "Phase 1.1: Test client created" "PASS" "Client ID: $TEST_CLIENT_ID"
        
        # Verify is_test flag in database
        if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            sleep 2
            TEST_CLIENT_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?email=eq.$TEST_CLIENT_EMAIL&select=email,is_test,business_name" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
            
            IS_TEST_FLAG=$(echo "$TEST_CLIENT_CHECK" | jq -r '.[0].is_test // empty')
            
            echo "Database check: $TEST_CLIENT_CHECK"
            
            if [ "$IS_TEST_FLAG" = "true" ]; then
                log_test "Phase 1.2: Test client has is_test=true" "PASS" "is_test: true ✅"
            else
                log_test "Phase 1.2: Test client has is_test=true" "FAIL" "Expected: true, Got: $IS_TEST_FLAG"
            fi
        fi
    else
        log_test "Phase 1.1: Test client created" "FAIL" "No client ID returned"
    fi
else
    log_test "Phase 1: Test client creation" "FAIL" "HTTP $HTTP_STATUS_TEST"
fi

sleep 2

# ============================================
# PHASE 2: Create Real/Production Client
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 2: Create Production Client (real domain email)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

REAL_CLIENT_EMAIL="john-${TEST_SUFFIX}@acmecorp.com"

REAL_CLIENT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_URL/client/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"businessName\": \"Acme Corporation ${TEST_SUFFIX}\",
        \"contactName\": \"John Smith\",
        \"email\": \"${REAL_CLIENT_EMAIL}\",
        \"password\": \"RealPassword123!\",
        \"language\": \"en\"
    }")

HTTP_STATUS_REAL=$(echo "$REAL_CLIENT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
REAL_CLIENT_BODY=$(echo "$REAL_CLIENT_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_REAL"
echo "Response: $REAL_CLIENT_BODY"

if [ "$HTTP_STATUS_REAL" = "200" ] || [ "$HTTP_STATUS_REAL" = "201" ]; then
    REAL_CLIENT_ID=$(echo "$REAL_CLIENT_BODY" | jq -r '.data.clientId // empty')
    REAL_API_KEY=$(echo "$REAL_CLIENT_BODY" | jq -r '.data.apiKey // empty')
    
    if [ -n "$REAL_CLIENT_ID" ]; then
        log_test "Phase 2.1: Real client created" "PASS" "Client ID: $REAL_CLIENT_ID"
        
        # Verify is_test flag in database
        if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            sleep 2
            REAL_CLIENT_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?email=eq.$REAL_CLIENT_EMAIL&select=email,is_test,business_name" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
            
            IS_TEST_FLAG_REAL=$(echo "$REAL_CLIENT_CHECK" | jq -r '.[0].is_test')
            
            echo "Database check: $REAL_CLIENT_CHECK"
            echo "is_test value: '$IS_TEST_FLAG_REAL'"
            
            if [ "$IS_TEST_FLAG_REAL" = "false" ] || [ "$IS_TEST_FLAG_REAL" = "null" ] || [ -z "$IS_TEST_FLAG_REAL" ]; then
                log_test "Phase 2.2: Real client has is_test=false" "PASS" "is_test: $IS_TEST_FLAG_REAL ✅"
            else
                log_test "Phase 2.2: Real client has is_test=false" "FAIL" "Expected: false, Got: $IS_TEST_FLAG_REAL"
            fi
        fi
    else
        log_test "Phase 2.1: Real client created" "FAIL" "No client ID returned"
    fi
else
    log_test "Phase 2: Real client creation" "FAIL" "HTTP $HTTP_STATUS_REAL"
fi

sleep 2

# ============================================
# PHASE 3: Submit Test Leads (English)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 3: Submit Test Leads (English - example.com)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TEST_API_KEY" ]; then
    TEST_LEAD_EMAIL="test-lead-en-${TEST_SUFFIX}@example.com"
    
    TEST_LEAD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$API_URL/lead" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $TEST_API_KEY" \
        -d "{
            \"name\": \"Test Lead User\",
            \"email\": \"${TEST_LEAD_EMAIL}\",
            \"message\": \"Testing lead submission with example.com email\",
            \"locale\": \"en\"
        }")
    
    HTTP_STATUS_TEST_LEAD=$(echo "$TEST_LEAD_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    TEST_LEAD_BODY=$(echo "$TEST_LEAD_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $HTTP_STATUS_TEST_LEAD"
    echo "Response: $TEST_LEAD_BODY"
    
    if [ "$HTTP_STATUS_TEST_LEAD" = "200" ] || [ "$HTTP_STATUS_TEST_LEAD" = "201" ]; then
        TEST_LEAD_ID=$(echo "$TEST_LEAD_BODY" | jq -r '.leadId // .data.leadId // empty')
        
        if [ -n "$TEST_LEAD_ID" ]; then
            log_test "Phase 3.1: Test lead created" "PASS" "Lead ID: $TEST_LEAD_ID"
            
            # Verify is_test flag in lead_memory
            if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
                sleep 2
                TEST_LEAD_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$TEST_LEAD_ID&select=email,is_test" \
                    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
                
                IS_TEST_LEAD=$(echo "$TEST_LEAD_CHECK" | jq -r '.[0].is_test // empty')
                
                echo "Lead database check: $TEST_LEAD_CHECK"
                
                if [ "$IS_TEST_LEAD" = "true" ]; then
                    log_test "Phase 3.2: Test lead has is_test=true" "PASS" "is_test: true ✅"
                else
                    log_test "Phase 3.2: Test lead has is_test=true" "FAIL" "Expected: true, Got: $IS_TEST_LEAD"
                fi
                
                # Verify is_test in lead_actions
                TEST_ACTION_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$TEST_LEAD_ID&select=lead_id,is_test" \
                    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
                
                IS_TEST_ACTION=$(echo "$TEST_ACTION_CHECK" | jq -r '.[0].is_test // empty')
                
                echo "Action database check: $TEST_ACTION_CHECK"
                
                if [ "$IS_TEST_ACTION" = "true" ]; then
                    log_test "Phase 3.3: Test lead_actions has is_test=true" "PASS" "is_test: true ✅"
                else
                    log_test "Phase 3.3: Test lead_actions has is_test=true" "FAIL" "Expected: true, Got: $IS_TEST_ACTION"
                fi
            fi
        else
            log_test "Phase 3.1: Test lead created" "FAIL" "No lead ID returned"
        fi
    else
        log_test "Phase 3: Test lead submission" "FAIL" "HTTP $HTTP_STATUS_TEST_LEAD"
    fi
else
    log_test "Phase 3: Test lead submission" "FAIL" "No test API key available"
fi

sleep 2

# ============================================
# PHASE 4: Submit Real Leads (English)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 4: Submit Real Leads (English - real domain)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$REAL_API_KEY" ]; then
    REAL_LEAD_EMAIL="john.lead-${TEST_SUFFIX}@realcompany.com"
    
    REAL_LEAD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$API_URL/lead" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $REAL_API_KEY" \
        -d "{
            \"name\": \"John Doe\",
            \"email\": \"${REAL_LEAD_EMAIL}\",
            \"message\": \"Interested in your AI solutions for our business\",
            \"locale\": \"en\"
        }")
    
    HTTP_STATUS_REAL_LEAD=$(echo "$REAL_LEAD_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    REAL_LEAD_BODY=$(echo "$REAL_LEAD_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $HTTP_STATUS_REAL_LEAD"
    echo "Response: $REAL_LEAD_BODY"
    
    if [ "$HTTP_STATUS_REAL_LEAD" = "200" ] || [ "$HTTP_STATUS_REAL_LEAD" = "201" ]; then
        REAL_LEAD_ID=$(echo "$REAL_LEAD_BODY" | jq -r '.leadId // .data.leadId // empty')
        
        if [ -n "$REAL_LEAD_ID" ]; then
            log_test "Phase 4.1: Real lead created" "PASS" "Lead ID: $REAL_LEAD_ID"
            
            # Verify is_test flag in lead_memory
            if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
                sleep 2
                REAL_LEAD_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$REAL_LEAD_ID&select=email,is_test" \
                    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
                
                IS_TEST_REAL_LEAD=$(echo "$REAL_LEAD_CHECK" | jq -r '.[0].is_test // empty')
                
                echo "Lead database check: $REAL_LEAD_CHECK"
                
                if [ "$IS_TEST_REAL_LEAD" = "false" ]; then
                    log_test "Phase 4.2: Real lead has is_test=false" "PASS" "is_test: false ✅"
                else
                    log_test "Phase 4.2: Real lead has is_test=false" "FAIL" "Expected: false, Got: $IS_TEST_REAL_LEAD"
                fi
                
                # Verify is_test in lead_actions
                REAL_ACTION_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$REAL_LEAD_ID&select=lead_id,is_test" \
                    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
                
                IS_TEST_REAL_ACTION=$(echo "$REAL_ACTION_CHECK" | jq -r '.[0].is_test // empty')
                
                echo "Action database check: $REAL_ACTION_CHECK"
                
                if [ "$IS_TEST_REAL_ACTION" = "false" ]; then
                    log_test "Phase 4.3: Real lead_actions has is_test=false" "PASS" "is_test: false ✅"
                else
                    log_test "Phase 4.3: Real lead_actions has is_test=false" "FAIL" "Expected: false, Got: $IS_TEST_REAL_ACTION"
                fi
            fi
        else
            log_test "Phase 4.1: Real lead created" "FAIL" "No lead ID returned"
        fi
    else
        log_test "Phase 4: Real lead submission" "FAIL" "HTTP $HTTP_STATUS_REAL_LEAD"
    fi
else
    log_test "Phase 4: Real lead submission" "FAIL" "No real API key available"
fi

sleep 2

# ============================================
# PHASE 5: Submit French Leads
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 5: Submit French Leads${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test lead (French)
if [ -n "$TEST_API_KEY" ]; then
    TEST_LEAD_FR_EMAIL="test-lead-fr-${TEST_SUFFIX}@example.com"
    
    TEST_LEAD_FR_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$API_URL/lead" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $TEST_API_KEY" \
        -d "{
            \"name\": \"Utilisateur Test\",
            \"email\": \"${TEST_LEAD_FR_EMAIL}\",
            \"message\": \"Test de soumission de lead avec email example.com\",
            \"locale\": \"fr\"
        }")
    
    HTTP_STATUS_TEST_FR=$(echo "$TEST_LEAD_FR_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    
    if [ "$HTTP_STATUS_TEST_FR" = "200" ] || [ "$HTTP_STATUS_TEST_FR" = "201" ]; then
        TEST_LEAD_FR_ID=$(echo "$TEST_LEAD_FR_RESPONSE" | sed '/HTTP_STATUS/d' | jq -r '.leadId // .data.leadId // empty')
        if [ -n "$TEST_LEAD_FR_ID" ]; then
            log_test "Phase 5.1: French test lead created" "PASS" "Lead ID: $TEST_LEAD_FR_ID"
        else
            log_test "Phase 5.1: French test lead created" "FAIL" "No lead ID"
        fi
    else
        log_test "Phase 5.1: French test lead created" "FAIL" "HTTP $HTTP_STATUS_TEST_FR"
    fi
fi

# Real lead (French)
if [ -n "$REAL_API_KEY" ]; then
    REAL_LEAD_FR_EMAIL="marie-${TEST_SUFFIX}@entreprise.com"
    
    REAL_LEAD_FR_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$API_URL/lead" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $REAL_API_KEY" \
        -d "{
            \"name\": \"Marie Dubois\",
            \"email\": \"${REAL_LEAD_FR_EMAIL}\",
            \"message\": \"Intéressée par vos solutions d'intelligence artificielle\",
            \"locale\": \"fr\"
        }")
    
    HTTP_STATUS_REAL_FR=$(echo "$REAL_LEAD_FR_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    
    if [ "$HTTP_STATUS_REAL_FR" = "200" ] || [ "$HTTP_STATUS_REAL_FR" = "201" ]; then
        REAL_LEAD_FR_ID=$(echo "$REAL_LEAD_FR_RESPONSE" | sed '/HTTP_STATUS/d' | jq -r '.leadId // .data.leadId // empty')
        if [ -n "$REAL_LEAD_FR_ID" ]; then
            log_test "Phase 5.2: French real lead created" "PASS" "Lead ID: $REAL_LEAD_FR_ID"
        else
            log_test "Phase 5.2: French real lead created" "FAIL" "No lead ID"
        fi
    else
        log_test "Phase 5.2: French real lead created" "FAIL" "HTTP $HTTP_STATUS_REAL_FR"
    fi
fi

sleep 2

# ============================================
# PHASE 6: Verify Data Isolation
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 6: Verify Data Isolation (Production View)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Count production clients (is_test = false)
    PROD_CLIENTS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?is_test=eq.false&select=count" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Prefer: count=exact")
    
    PROD_CLIENT_COUNT=$(echo "$PROD_CLIENTS" | jq -r '.[0].count // 0')
    
    echo "Production clients (is_test=false): $PROD_CLIENT_COUNT"
    
    # Count test clients (is_test = true)
    TEST_CLIENTS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?is_test=eq.true&select=count" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Prefer: count=exact")
    
    TEST_CLIENT_COUNT=$(echo "$TEST_CLIENTS" | jq -r '.[0].count // 0')
    
    echo "Test clients (is_test=true): $TEST_CLIENT_COUNT"
    
    if [ "$TEST_CLIENT_COUNT" -ge 1 ] && [ "$PROD_CLIENT_COUNT" -ge 1 ]; then
        log_test "Phase 6.1: Data properly segregated" "PASS" "Test: $TEST_CLIENT_COUNT, Prod: $PROD_CLIENT_COUNT"
    else
        log_test "Phase 6.1: Data properly segregated" "FAIL" "Test: $TEST_CLIENT_COUNT, Prod: $PROD_CLIENT_COUNT"
    fi
    
    # Count production leads (is_test = false)
    PROD_LEADS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?is_test=eq.false&select=count" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Prefer: count=exact")
    
    PROD_LEAD_COUNT=$(echo "$PROD_LEADS" | jq -r '.[0].count // 0')
    
    echo "Production leads (is_test=false): $PROD_LEAD_COUNT"
    
    # Count test leads (is_test = true)
    TEST_LEADS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?is_test=eq.true&select=count" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Prefer: count=exact")
    
    TEST_LEAD_COUNT=$(echo "$TEST_LEADS" | jq -r '.[0].count // 0')
    
    echo "Test leads (is_test=true): $TEST_LEAD_COUNT"
    
    if [ "$TEST_LEAD_COUNT" -ge 2 ] && [ "$PROD_LEAD_COUNT" -ge 2 ]; then
        log_test "Phase 6.2: Leads properly segregated" "PASS" "Test: $TEST_LEAD_COUNT, Prod: $PROD_LEAD_COUNT"
    else
        log_test "Phase 6.2: Leads properly segregated" "FAIL" "Test: $TEST_LEAD_COUNT, Prod: $PROD_LEAD_COUNT"
    fi
fi

sleep 2

# ============================================
# PHASE 7: Verify AI Enrichment & Relationship Insights
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 7: Verify AI Enrichment Works for Both Types${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TEST_LEAD_ID" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Check test lead enrichment
    TEST_ENRICHMENT=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$TEST_LEAD_ID&select=intent,tone,urgency,confidence_score,relationship_insight" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    TEST_INTENT=$(echo "$TEST_ENRICHMENT" | jq -r '.[0].intent // empty')
    TEST_TONE=$(echo "$TEST_ENRICHMENT" | jq -r '.[0].tone // empty')
    
    echo "Test lead enrichment: intent=$TEST_INTENT, tone=$TEST_TONE"
    
    if [ -n "$TEST_INTENT" ] && [ -n "$TEST_TONE" ]; then
        log_test "Phase 7.1: Test lead AI enrichment works" "PASS" "Intent: $TEST_INTENT, Tone: $TEST_TONE"
    else
        log_test "Phase 7.1: Test lead AI enrichment works" "FAIL" "Missing enrichment data"
    fi
fi

if [ -n "$REAL_LEAD_ID" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Check real lead enrichment
    REAL_ENRICHMENT=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$REAL_LEAD_ID&select=intent,tone,urgency,confidence_score,relationship_insight" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    REAL_INTENT=$(echo "$REAL_ENRICHMENT" | jq -r '.[0].intent // empty')
    REAL_TONE=$(echo "$REAL_ENRICHMENT" | jq -r '.[0].tone // empty')
    
    echo "Real lead enrichment: intent=$REAL_INTENT, tone=$REAL_TONE"
    
    if [ -n "$REAL_INTENT" ] && [ -n "$REAL_TONE" ]; then
        log_test "Phase 7.2: Real lead AI enrichment works" "PASS" "Intent: $REAL_INTENT, Tone: $REAL_TONE"
    else
        log_test "Phase 7.2: Real lead AI enrichment works" "FAIL" "Missing enrichment data"
    fi
fi

# ============================================
# FINAL TEST SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_TESTS=${#TEST_RESULTS[@]}
PASSED_TESTS=0
FAILED_TESTS=0

for result in "${TEST_RESULTS[@]}"; do
    STATUS=$(echo "$result" | cut -d'|' -f1)
    if [ "$STATUS" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! is_test System Verified ✅              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ SOME TESTS FAILED - Review logs above                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 Summary Statistics:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Test Client:        $TEST_CLIENT_EMAIL"
echo "Production Client:  $REAL_CLIENT_EMAIL"
echo ""
echo "Test Clients:       $TEST_CLIENT_COUNT"
echo "Production Clients: $PROD_CLIENT_COUNT"
echo ""
echo "Test Leads:         $TEST_LEAD_COUNT"
echo "Production Leads:   $PROD_LEAD_COUNT"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit $EXIT_CODE

