#!/bin/bash

# ============================================
# Avenir AI Solutions Internal UUID Regression Test
# ============================================
# Tests the complete lead pipeline with the new internal client UUID:
# 00000000-0000-0000-0000-000000000001

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="https://www.aveniraisolutions.ca"
INTERNAL_UUID="00000000-0000-0000-0000-000000000001"
TEST_SUFFIX=$(date +%s)
TEST_RESULTS=()

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Avenir AI Solutions Internal UUID Regression Test           ║${NC}"
echo -e "${BLUE}║   Internal UUID: 00000000-0000-0000-0000-000000000001         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Internal UUID: $INTERNAL_UUID"
echo "Test Suffix: $TEST_SUFFIX"
echo ""

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
# TEST 1: New Lead Submission (English)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 1: New Lead Submission from aveniraisolutions.ca (EN)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL_EN="test-avenir-en-${TEST_SUFFIX}@example.com"

echo "ℹ️  Note: This test uses 'Test' keywords and 'example.com' domain,"
echo "   so leads will be automatically marked as is_test=true"
echo ""

LEAD_EN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$BASE_URL/api/lead" \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.aveniraisolutions.ca" \
    -H "Referer: https://www.aveniraisolutions.ca/en" \
    -d "{
        \"name\": \"Test User EN ${TEST_SUFFIX}\",
        \"email\": \"${TEST_EMAIL_EN}\",
        \"message\": \"Testing English form submission with internal UUID\",
        \"locale\": \"en\"
    }")

HTTP_STATUS_EN=$(echo "$LEAD_EN_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
LEAD_EN_BODY=$(echo "$LEAD_EN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_EN"
echo "Response: $LEAD_EN_BODY"

if [ "$HTTP_STATUS_EN" = "200" ] || [ "$HTTP_STATUS_EN" = "201" ]; then
    LEAD_ID_EN=$(echo "$LEAD_EN_BODY" | jq -r '.leadId // .data.leadId // empty')
    if [ -n "$LEAD_ID_EN" ]; then
        log_test "Test 1.1: English lead created" "PASS" "Lead ID: $LEAD_ID_EN"
    else
        log_test "Test 1.1: English lead created" "FAIL" "No lead ID returned"
    fi
else
    log_test "Test 1.1: English lead created" "FAIL" "HTTP $HTTP_STATUS_EN"
fi

sleep 2

# ============================================
# TEST 2: New Lead Submission (French)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 2: New Lead Submission from aveniraisolutions.ca (FR)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL_FR="test-avenir-fr-${TEST_SUFFIX}@example.com"

LEAD_FR_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$BASE_URL/api/lead" \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.aveniraisolutions.ca" \
    -H "Referer: https://www.aveniraisolutions.ca/fr" \
    -d "{
        \"name\": \"Utilisateur Test FR ${TEST_SUFFIX}\",
        \"email\": \"${TEST_EMAIL_FR}\",
        \"message\": \"Test de soumission de formulaire français avec UUID interne\",
        \"locale\": \"fr\"
    }")

HTTP_STATUS_FR=$(echo "$LEAD_FR_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
LEAD_FR_BODY=$(echo "$LEAD_FR_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_FR"
echo "Response: $LEAD_FR_BODY"

if [ "$HTTP_STATUS_FR" = "200" ] || [ "$HTTP_STATUS_FR" = "201" ]; then
    LEAD_ID_FR=$(echo "$LEAD_FR_BODY" | jq -r '.leadId // .data.leadId // empty')
    if [ -n "$LEAD_ID_FR" ]; then
        log_test "Test 2.1: French lead created" "PASS" "Lead ID: $LEAD_ID_FR"
    else
        log_test "Test 2.1: French lead created" "FAIL" "No lead ID returned"
    fi
else
    log_test "Test 2.1: French lead created" "FAIL" "HTTP $HTTP_STATUS_FR"
fi

sleep 2

# ============================================
# TEST 3: Verify lead_memory client_id (Direct DB Check)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3: Verify lead_memory has correct client_id (Supabase)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Check EN lead
    if [ -n "$LEAD_ID_EN" ]; then
        LEAD_MEMORY_EN=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$LEAD_ID_EN&select=id,email,client_id" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        CLIENT_ID_EN=$(echo "$LEAD_MEMORY_EN" | jq -r '.[0].client_id // empty')
        
        echo "EN Lead - lead_memory query result:"
        echo "$LEAD_MEMORY_EN" | jq '.'
        
        if [ "$CLIENT_ID_EN" = "$INTERNAL_UUID" ]; then
            log_test "Test 3.1: EN lead has correct UUID in lead_memory" "PASS" "client_id: $CLIENT_ID_EN"
        else
            log_test "Test 3.1: EN lead has correct UUID in lead_memory" "FAIL" "Expected: $INTERNAL_UUID, Got: $CLIENT_ID_EN"
        fi
    else
        log_test "Test 3.1: EN lead has correct UUID in lead_memory" "FAIL" "No lead ID available"
    fi
    
    # Check FR lead
    if [ -n "$LEAD_ID_FR" ]; then
        LEAD_MEMORY_FR=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$LEAD_ID_FR&select=id,email,client_id" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        CLIENT_ID_FR=$(echo "$LEAD_MEMORY_FR" | jq -r '.[0].client_id // empty')
        
        echo "FR Lead - lead_memory query result:"
        echo "$LEAD_MEMORY_FR" | jq '.'
        
        if [ "$CLIENT_ID_FR" = "$INTERNAL_UUID" ]; then
            log_test "Test 3.2: FR lead has correct UUID in lead_memory" "PASS" "client_id: $CLIENT_ID_FR"
        else
            log_test "Test 3.2: FR lead has correct UUID in lead_memory" "FAIL" "Expected: $INTERNAL_UUID, Got: $CLIENT_ID_FR"
        fi
    else
        log_test "Test 3.2: FR lead has correct UUID in lead_memory" "FAIL" "No lead ID available"
    fi
else
    log_test "Test 3: lead_memory verification" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 4: Verify lead_actions entries
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 4: Verify lead_actions entries with internal UUID${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Check EN lead actions
    if [ -n "$LEAD_ID_EN" ]; then
        LEAD_ACTIONS_EN=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$LEAD_ID_EN&select=lead_id,client_id,action_type,tag" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        ACTIONS_CLIENT_ID_EN=$(echo "$LEAD_ACTIONS_EN" | jq -r '.[0].client_id // empty')
        ACTIONS_COUNT_EN=$(echo "$LEAD_ACTIONS_EN" | jq 'length')
        
        echo "EN Lead - lead_actions query result:"
        echo "$LEAD_ACTIONS_EN" | jq '.'
        
        if [ "$ACTIONS_COUNT_EN" -gt 0 ] && [ "$ACTIONS_CLIENT_ID_EN" = "$INTERNAL_UUID" ]; then
            log_test "Test 4.1: EN lead_actions created with correct UUID" "PASS" "Count: $ACTIONS_COUNT_EN, client_id: $ACTIONS_CLIENT_ID_EN"
        else
            log_test "Test 4.1: EN lead_actions created with correct UUID" "FAIL" "Count: $ACTIONS_COUNT_EN, client_id: $ACTIONS_CLIENT_ID_EN"
        fi
    else
        log_test "Test 4.1: EN lead_actions verification" "FAIL" "No lead ID available"
    fi
    
    # Check FR lead actions
    if [ -n "$LEAD_ID_FR" ]; then
        LEAD_ACTIONS_FR=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$LEAD_ID_FR&select=lead_id,client_id,action_type,tag" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        ACTIONS_CLIENT_ID_FR=$(echo "$LEAD_ACTIONS_FR" | jq -r '.[0].client_id // empty')
        ACTIONS_COUNT_FR=$(echo "$LEAD_ACTIONS_FR" | jq 'length')
        
        echo "FR Lead - lead_actions query result:"
        echo "$LEAD_ACTIONS_FR" | jq '.'
        
        if [ "$ACTIONS_COUNT_FR" -gt 0 ] && [ "$ACTIONS_CLIENT_ID_FR" = "$INTERNAL_UUID" ]; then
            log_test "Test 4.2: FR lead_actions created with correct UUID" "PASS" "Count: $ACTIONS_COUNT_FR, client_id: $ACTIONS_CLIENT_ID_FR"
        else
            log_test "Test 4.2: FR lead_actions created with correct UUID" "FAIL" "Count: $ACTIONS_COUNT_FR, client_id: $ACTIONS_CLIENT_ID_FR"
        fi
    else
        log_test "Test 4.2: FR lead_actions verification" "FAIL" "No lead ID available"
    fi
else
    log_test "Test 4: lead_actions verification" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 5: Retroactive Client ID Assignment (NULL → UUID)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 5: Retroactive Assignment - NULL → UUID${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL_NULL="test-null-${TEST_SUFFIX}@example.com"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Create a lead with NULL client_id
    echo "Creating test lead with NULL client_id..."
    
    NULL_LEAD_INSERT=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{
            \"email\": \"${TEST_EMAIL_NULL}\",
            \"name\": \"Test NULL User\",
            \"message\": \"Test message with NULL client_id\",
            \"client_id\": null,
            \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
            \"intent\": \"Product inquiry\",
            \"tone\": \"Curious\",
            \"urgency\": \"Medium\",
            \"confidence_score\": 0.7,
            \"language\": \"en\"
        }")
    
    NULL_LEAD_ID=$(echo "$NULL_LEAD_INSERT" | jq -r '.[0].id // empty')
    
    if [ -n "$NULL_LEAD_ID" ]; then
        echo "NULL lead created with ID: $NULL_LEAD_ID"
        
        # Now submit again to trigger retroactive assignment
        sleep 2
        
        RESUBMIT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
            "$BASE_URL/api/lead" \
            -H "Content-Type: application/json" \
            -H "Origin: https://www.aveniraisolutions.ca" \
            -H "Referer: https://www.aveniraisolutions.ca/en" \
            -d "{
                \"name\": \"Test NULL User (Resubmit)\",
                \"email\": \"${TEST_EMAIL_NULL}\",
                \"message\": \"Resubmitting to trigger retroactive UUID assignment\",
                \"locale\": \"en\"
            }")
        
        RESUBMIT_STATUS=$(echo "$RESUBMIT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
        
        echo "Resubmit HTTP Status: $RESUBMIT_STATUS"
        
        if [ "$RESUBMIT_STATUS" = "200" ] || [ "$RESUBMIT_STATUS" = "201" ]; then
            sleep 2
            
            # Verify client_id was updated
            UPDATED_LEAD=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$NULL_LEAD_ID&select=id,email,client_id" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
            
            UPDATED_CLIENT_ID=$(echo "$UPDATED_LEAD" | jq -r '.[0].client_id // empty')
            
            echo "Updated lead client_id: $UPDATED_CLIENT_ID"
            
            if [ "$UPDATED_CLIENT_ID" = "$INTERNAL_UUID" ]; then
                log_test "Test 5.1: NULL → UUID retroactive assignment" "PASS" "NULL → $INTERNAL_UUID"
            else
                log_test "Test 5.1: NULL → UUID retroactive assignment" "FAIL" "Expected: $INTERNAL_UUID, Got: $UPDATED_CLIENT_ID"
            fi
        else
            log_test "Test 5.1: NULL → UUID retroactive assignment" "FAIL" "Resubmit failed: HTTP $RESUBMIT_STATUS"
        fi
    else
        log_test "Test 5.1: NULL → UUID retroactive assignment" "FAIL" "Could not create NULL lead"
    fi
else
    log_test "Test 5: Retroactive assignment (NULL)" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 6: Retroactive Client ID Correction (Old String → UUID)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 6: Retroactive Correction - 'avenir-internal-client' → UUID${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL_OLD="test-old-string-${TEST_SUFFIX}@example.com"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Create a lead with old string format
    echo "Creating test lead with old string 'avenir-internal-client'..."
    
    OLD_LEAD_INSERT=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "{
            \"email\": \"${TEST_EMAIL_OLD}\",
            \"name\": \"Test Old String User\",
            \"message\": \"Test message with old string client_id\",
            \"client_id\": \"avenir-internal-client\",
            \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
            \"intent\": \"Product inquiry\",
            \"tone\": \"Curious\",
            \"urgency\": \"Medium\",
            \"confidence_score\": 0.7,
            \"language\": \"en\"
        }")
    
    OLD_LEAD_ID=$(echo "$OLD_LEAD_INSERT" | jq -r '.[0].id // empty')
    
    if [ -n "$OLD_LEAD_ID" ]; then
        echo "Old string lead created with ID: $OLD_LEAD_ID"
        
        # Now submit again to trigger correction
        sleep 2
        
        CORRECT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
            "$BASE_URL/api/lead" \
            -H "Content-Type: application/json" \
            -H "Origin: https://www.aveniraisolutions.ca" \
            -H "Referer: https://www.aveniraisolutions.ca/en" \
            -d "{
                \"name\": \"Test Old String User (Resubmit)\",
                \"email\": \"${TEST_EMAIL_OLD}\",
                \"message\": \"Resubmitting to trigger UUID correction\",
                \"locale\": \"en\"
            }")
        
        CORRECT_STATUS=$(echo "$CORRECT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
        
        echo "Correction resubmit HTTP Status: $CORRECT_STATUS"
        
        if [ "$CORRECT_STATUS" = "200" ] || [ "$CORRECT_STATUS" = "201" ]; then
            sleep 2
            
            # Verify client_id was corrected
            CORRECTED_LEAD=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$OLD_LEAD_ID&select=id,email,client_id" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
            
            CORRECTED_CLIENT_ID=$(echo "$CORRECTED_LEAD" | jq -r '.[0].client_id // empty')
            
            echo "Corrected lead client_id: $CORRECTED_CLIENT_ID"
            
            if [ "$CORRECTED_CLIENT_ID" = "$INTERNAL_UUID" ]; then
                log_test "Test 6.1: Old string → UUID correction" "PASS" "'avenir-internal-client' → $INTERNAL_UUID"
            else
                log_test "Test 6.1: Old string → UUID correction" "FAIL" "Expected: $INTERNAL_UUID, Got: $CORRECTED_CLIENT_ID"
            fi
        else
            log_test "Test 6.1: Old string → UUID correction" "FAIL" "Resubmit failed: HTTP $CORRECT_STATUS"
        fi
    else
        log_test "Test 6.1: Old string → UUID correction" "FAIL" "Could not create old string lead"
    fi
else
    log_test "Test 6: Retroactive correction (old string)" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 7: Admin Dashboard - Client List
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 7: Admin Dashboard - Avenir AI Solutions in Client List${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Query clients table for Avenir
    AVENIR_CLIENT=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?client_id=eq.$INTERNAL_UUID&select=client_id,business_name,is_internal" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    echo "Avenir client query result:"
    echo "$AVENIR_CLIENT" | jq '.'
    
    CLIENT_COUNT=$(echo "$AVENIR_CLIENT" | jq 'length')
    BUSINESS_NAME=$(echo "$AVENIR_CLIENT" | jq -r '.[0].business_name // empty')
    IS_INTERNAL=$(echo "$AVENIR_CLIENT" | jq -r '.[0].is_internal // empty')
    
    if [ "$CLIENT_COUNT" -eq 1 ] && [ "$BUSINESS_NAME" = "Avenir AI Solutions" ] && [ "$IS_INTERNAL" = "true" ]; then
        log_test "Test 7.1: Avenir AI Solutions in clients table" "PASS" "Found with is_internal: true"
    else
        log_test "Test 7.1: Avenir AI Solutions in clients table" "FAIL" "Count: $CLIENT_COUNT, Name: $BUSINESS_NAME, Internal: $IS_INTERNAL"
    fi
else
    log_test "Test 7: Client list verification" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 8: Lead Filtering by Internal UUID
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 8: Lead Filtering - Query leads by internal UUID${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Query lead_actions for internal client
    INTERNAL_LEADS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?client_id=eq.$INTERNAL_UUID&select=lead_id,client_id,tag&limit=10" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    echo "Internal leads query result (first 10):"
    echo "$INTERNAL_LEADS" | jq '.'
    
    INTERNAL_LEADS_COUNT=$(echo "$INTERNAL_LEADS" | jq 'length')
    
    if [ "$INTERNAL_LEADS_COUNT" -gt 0 ]; then
        log_test "Test 8.1: Filter leads by internal UUID" "PASS" "Found $INTERNAL_LEADS_COUNT leads with internal UUID"
    else
        log_test "Test 8.1: Filter leads by internal UUID" "FAIL" "No leads found with internal UUID"
    fi
    
    # Verify our test leads are in the results
    if [ -n "$LEAD_ID_EN" ]; then
        EN_IN_RESULTS=$(echo "$INTERNAL_LEADS" | jq -r ".[] | select(.lead_id == \"$LEAD_ID_EN\") | .lead_id")
        if [ -n "$EN_IN_RESULTS" ]; then
            log_test "Test 8.2: EN test lead appears in filtered results" "PASS" "Lead ID: $LEAD_ID_EN"
        else
            log_test "Test 8.2: EN test lead appears in filtered results" "FAIL" "Lead ID not found in results"
        fi
    fi
    
    if [ -n "$LEAD_ID_FR" ]; then
        FR_IN_RESULTS=$(echo "$INTERNAL_LEADS" | jq -r ".[] | select(.lead_id == \"$LEAD_ID_FR\") | .lead_id")
        if [ -n "$FR_IN_RESULTS" ]; then
            log_test "Test 8.3: FR test lead appears in filtered results" "PASS" "Lead ID: $LEAD_ID_FR"
        else
            log_test "Test 8.3: FR test lead appears in filtered results" "FAIL" "Lead ID not found in results"
        fi
    fi
else
    log_test "Test 8: Lead filtering verification" "FAIL" "Missing Supabase credentials"
fi

sleep 2

# ============================================
# TEST 9: Relationship Insights
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 9: Relationship Insights Generation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$LEAD_ID_EN" ] && [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    # Check if lead has relationship_insight
    INSIGHT_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_memory?id=eq.$LEAD_ID_EN&select=id,relationship_insight" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    RELATIONSHIP_INSIGHT=$(echo "$INSIGHT_CHECK" | jq -r '.[0].relationship_insight // empty')
    
    echo "Relationship insight for EN lead:"
    echo "$RELATIONSHIP_INSIGHT"
    
    if [ -n "$RELATIONSHIP_INSIGHT" ] && [ "$RELATIONSHIP_INSIGHT" != "null" ]; then
        log_test "Test 9.1: Relationship insight generated" "PASS" "Insight present"
    else
        log_test "Test 9.1: Relationship insight generated" "FAIL" "No insight found"
    fi
else
    log_test "Test 9: Relationship insights" "FAIL" "Missing prerequisites"
fi

sleep 2

# ============================================
# TEST 10: Lead Conversion
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 10: Lead Conversion Action${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$LEAD_ID_EN" ]; then
    CONVERSION_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$BASE_URL/api/lead-actions" \
        -H "Content-Type: application/json" \
        -d "{
            \"lead_id\": \"$LEAD_ID_EN\",
            \"client_id\": \"$INTERNAL_UUID\",
            \"action_type\": \"tag\",
            \"tag\": \"Converted\"
        }")
    
    CONVERSION_STATUS=$(echo "$CONVERSION_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    CONVERSION_BODY=$(echo "$CONVERSION_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "Conversion HTTP Status: $CONVERSION_STATUS"
    echo "Response: $CONVERSION_BODY"
    
    if [ "$CONVERSION_STATUS" = "200" ] || [ "$CONVERSION_STATUS" = "201" ]; then
        log_test "Test 10.1: Lead conversion action" "PASS" "Lead marked as Converted"
    else
        log_test "Test 10.1: Lead conversion action" "FAIL" "HTTP $CONVERSION_STATUS"
    fi
    
    sleep 2
    
    # Verify conversion_outcome in lead_actions
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        CONVERSION_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$LEAD_ID_EN&tag=eq.Converted&select=lead_id,tag,conversion_outcome" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        CONVERSION_OUTCOME=$(echo "$CONVERSION_CHECK" | jq -r '.[0].conversion_outcome // empty')
        
        echo "Conversion outcome: $CONVERSION_OUTCOME"
        
        if [ "$CONVERSION_OUTCOME" = "true" ]; then
            log_test "Test 10.2: Conversion outcome recorded" "PASS" "conversion_outcome: true"
        else
            log_test "Test 10.2: Conversion outcome recorded" "FAIL" "Expected: true, Got: $CONVERSION_OUTCOME"
        fi
    fi
else
    log_test "Test 10: Lead conversion" "FAIL" "No lead ID available"
fi

sleep 2

# ============================================
# TEST 11: Lead Reversion
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 11: Lead Reversion Action${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$LEAD_ID_EN" ]; then
    REVERSION_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
        "$BASE_URL/api/lead-actions" \
        -H "Content-Type: application/json" \
        -d "{
            \"lead_id\": \"$LEAD_ID_EN\",
            \"client_id\": \"$INTERNAL_UUID\",
            \"action_type\": \"tag\",
            \"tag\": \"Active\",
            \"is_reversion\": true,
            \"reversion_reason\": \"Testing reversion functionality\"
        }")
    
    REVERSION_STATUS=$(echo "$REVERSION_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    REVERSION_BODY=$(echo "$REVERSION_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "Reversion HTTP Status: $REVERSION_STATUS"
    echo "Response: $REVERSION_BODY"
    
    if [ "$REVERSION_STATUS" = "200" ] || [ "$REVERSION_STATUS" = "201" ]; then
        log_test "Test 11.1: Lead reversion action" "PASS" "Lead returned to Active"
    else
        log_test "Test 11.1: Lead reversion action" "FAIL" "HTTP $REVERSION_STATUS"
    fi
    
    sleep 2
    
    # Verify reversion in lead_actions
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        REVERSION_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lead_actions?lead_id=eq.$LEAD_ID_EN&order=timestamp.desc&limit=1&select=lead_id,tag,reversion_reason,conversion_outcome" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        REVERSION_REASON=$(echo "$REVERSION_CHECK" | jq -r '.[0].reversion_reason // empty')
        REVERSION_OUTCOME=$(echo "$REVERSION_CHECK" | jq -r '.[0].conversion_outcome // empty')
        
        echo "Reversion reason: $REVERSION_REASON"
        echo "Conversion outcome after reversion: $REVERSION_OUTCOME"
        
        if [ -n "$REVERSION_REASON" ] && [ "$REVERSION_OUTCOME" = "false" ]; then
            log_test "Test 11.2: Reversion reason recorded" "PASS" "Reason logged, outcome set to false"
        else
            log_test "Test 11.2: Reversion reason recorded" "FAIL" "Reason: $REVERSION_REASON, Outcome: $REVERSION_OUTCOME"
        fi
    fi
else
    log_test "Test 11: Lead reversion" "FAIL" "No lead ID available"
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
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! Internal UUID Pipeline Verified ✅      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ SOME TESTS FAILED - Review logs above                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
fi

echo ""
echo "Detailed Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for result in "${TEST_RESULTS[@]}"; do
    STATUS=$(echo "$result" | cut -d'|' -f1)
    NAME=$(echo "$result" | cut -d'|' -f2)
    DETAILS=$(echo "$result" | cut -d'|' -f3)
    
    if [ "$STATUS" = "PASS" ]; then
        echo -e "${GREEN}✅ $NAME${NC}"
    else
        echo -e "${RED}❌ $NAME${NC}"
    fi
    
    if [ -n "$DETAILS" ]; then
        echo "   $DETAILS"
    fi
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Test completed at: $(date)"
echo "Report saved to: AVENIR_INTERNAL_UUID_TEST_RESULTS.md"

# Generate markdown report
cat > AVENIR_INTERNAL_UUID_TEST_RESULTS.md << EOF
# Avenir AI Solutions Internal UUID Regression Test Results

**Test Date:** $(date)  
**Internal UUID:** \`00000000-0000-0000-0000-000000000001\`  
**Base URL:** $BASE_URL  
**Test Suffix:** $TEST_SUFFIX

---

## 📊 Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS ✅
- **Failed:** $FAILED_TESTS ❌
- **Pass Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

---

## 📋 Detailed Results

EOF

for result in "${TEST_RESULTS[@]}"; do
    STATUS=$(echo "$result" | cut -d'|' -f1)
    NAME=$(echo "$result" | cut -d'|' -f2)
    DETAILS=$(echo "$result" | cut -d'|' -f3)
    
    if [ "$STATUS" = "PASS" ]; then
        echo "### ✅ $NAME" >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md
    else
        echo "### ❌ $NAME" >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md
    fi
    
    echo "" >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md
    if [ -n "$DETAILS" ]; then
        echo "**Details:** $DETAILS" >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md
    fi
    echo "" >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md
done

cat >> AVENIR_INTERNAL_UUID_TEST_RESULTS.md << EOF
---

## ✅ Test Coverage

1. **New Lead Submission (EN)** - Verify leads from aveniraisolutions.ca/en get internal UUID
2. **New Lead Submission (FR)** - Verify leads from aveniraisolutions.ca/fr get internal UUID
3. **lead_memory Verification** - Confirm client_id is stored correctly
4. **lead_actions Verification** - Confirm lead_actions entries use internal UUID
5. **Retroactive Assignment (NULL)** - Verify NULL client_ids are corrected on resubmit
6. **Retroactive Correction (Old String)** - Verify 'avenir-internal-client' is corrected to UUID
7. **Client List** - Confirm Avenir AI Solutions appears in clients table
8. **Lead Filtering** - Verify leads can be filtered by internal UUID
9. **Relationship Insights** - Confirm insights are generated normally
10. **Lead Conversion** - Verify conversion actions work with internal UUID
11. **Lead Reversion** - Verify reversion actions work with internal UUID

---

**Status:** $( [ $FAILED_TESTS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED" )
EOF

echo ""
echo "✅ Markdown report generated: AVENIR_INTERNAL_UUID_TEST_RESULTS.md"

exit $EXIT_CODE

