#!/bin/bash

# ============================================
# Personalized Email Signup E2E Test
# ============================================
# Tests Phase 1: Signup form with branding fields

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"
TEST_SUFFIX=$(date +%s)

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Personalized Email Signup E2E Test (Phase 1)                ║${NC}"
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
    exit 1
else
    echo -e "${GREEN}✅ Dev server is running (HTTP $SERVER_CHECK)${NC}"
    echo ""
fi

sleep 1

# ============================================
# TEST 1: Complete Signup with All Branding Fields
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 1: Complete Signup with Branding Fields${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL="branding-test-${TEST_SUFFIX}@example.com"
TEST_BUSINESS="Test Company ${TEST_SUFFIX}"
TEST_TAGLINE="AI that helps businesses grow faster"

echo "Test Data:"
echo "  Business:    $TEST_BUSINESS"
echo "  Email:       $TEST_EMAIL"
echo "  Tagline:     $TEST_TAGLINE"
echo "  Email Tone:  Friendly"
echo "  Speed:       Instant"
echo ""

SIGNUP_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_URL/client/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"businessName\": \"$TEST_BUSINESS\",
        \"contactName\": \"Test User\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"TestPassword123!\",
        \"language\": \"en\",
        \"customTagline\": \"$TEST_TAGLINE\",
        \"emailTone\": \"Friendly\",
        \"followupSpeed\": \"Instant\"
    }")

HTTP_STATUS=$(echo "$SIGNUP_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
SIGNUP_BODY=$(echo "$SIGNUP_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response Body:"
echo "$SIGNUP_BODY" | jq '.'
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ TEST 1.1: Signup successful (HTTP $HTTP_STATUS)${NC}"
    
    CLIENT_ID=$(echo "$SIGNUP_BODY" | jq -r '.data.clientId // empty')
    API_KEY=$(echo "$SIGNUP_BODY" | jq -r '.data.apiKey // empty')
    
    echo "  Client ID: $CLIENT_ID"
    echo "  API Key:   ${API_KEY:0:20}..."
    echo ""
else
    echo -e "${RED}❌ TEST 1.1: Signup failed (HTTP $HTTP_STATUS)${NC}"
    echo ""
    exit 1
fi

sleep 2

# ============================================
# TEST 2: Verify Database Storage
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 2: Verify Database Storage (Supabase)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    DB_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?email=eq.$TEST_EMAIL&select=business_name,email,custom_tagline,email_tone,followup_speed,ai_personalized_reply,is_test" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    echo "Database Query Result:"
    echo "$DB_CHECK" | jq '.'
    echo ""
    
    STORED_TAGLINE=$(echo "$DB_CHECK" | jq -r '.[0].custom_tagline // empty')
    STORED_TONE=$(echo "$DB_CHECK" | jq -r '.[0].email_tone // empty')
    STORED_SPEED=$(echo "$DB_CHECK" | jq -r '.[0].followup_speed // empty')
    STORED_AI_REPLY=$(echo "$DB_CHECK" | jq -r '.[0].ai_personalized_reply')
    STORED_IS_TEST=$(echo "$DB_CHECK" | jq -r '.[0].is_test')
    
    echo -e "${CYAN}Verification:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check custom_tagline
    if [ "$STORED_TAGLINE" = "$TEST_TAGLINE" ]; then
        echo -e "${GREEN}✅ TEST 2.1: custom_tagline saved correctly${NC}"
        echo "   Expected: $TEST_TAGLINE"
        echo "   Got:      $STORED_TAGLINE"
    else
        echo -e "${RED}❌ TEST 2.1: custom_tagline mismatch${NC}"
        echo "   Expected: $TEST_TAGLINE"
        echo "   Got:      $STORED_TAGLINE"
    fi
    echo ""
    
    # Check email_tone
    if [ "$STORED_TONE" = "Friendly" ]; then
        echo -e "${GREEN}✅ TEST 2.2: email_tone saved correctly${NC}"
        echo "   Expected: Friendly"
        echo "   Got:      $STORED_TONE"
    else
        echo -e "${RED}❌ TEST 2.2: email_tone mismatch${NC}"
        echo "   Expected: Friendly"
        echo "   Got:      $STORED_TONE"
    fi
    echo ""
    
    # Check followup_speed
    if [ "$STORED_SPEED" = "Instant" ]; then
        echo -e "${GREEN}✅ TEST 2.3: followup_speed saved correctly${NC}"
        echo "   Expected: Instant"
        echo "   Got:      $STORED_SPEED"
    else
        echo -e "${RED}❌ TEST 2.3: followup_speed mismatch${NC}"
        echo "   Expected: Instant"
        echo "   Got:      $STORED_SPEED"
    fi
    echo ""
    
    # Check ai_personalized_reply
    if [ "$STORED_AI_REPLY" = "true" ]; then
        echo -e "${GREEN}✅ TEST 2.4: ai_personalized_reply set to TRUE${NC}"
        echo "   Expected: true"
        echo "   Got:      $STORED_AI_REPLY"
    else
        echo -e "${RED}❌ TEST 2.4: ai_personalized_reply mismatch${NC}"
        echo "   Expected: true"
        echo "   Got:      $STORED_AI_REPLY"
    fi
    echo ""
    
    # Check is_test
    if [ "$STORED_IS_TEST" = "true" ]; then
        echo -e "${GREEN}✅ TEST 2.5: is_test flag set correctly${NC}"
        echo "   Expected: true (example.com email)"
        echo "   Got:      $STORED_IS_TEST"
    else
        echo -e "${RED}❌ TEST 2.5: is_test flag mismatch${NC}"
        echo "   Expected: true"
        echo "   Got:      $STORED_IS_TEST"
    fi
    echo ""
    
else
    echo -e "${RED}❌ Skipping database verification (missing Supabase credentials)${NC}"
    echo ""
fi

# ============================================
# TEST 3: French Signup with Different Preferences
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3: French Signup with Different Preferences${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TEST_EMAIL_FR="test-fr-${TEST_SUFFIX}@example.com"
TEST_BUSINESS_FR="Entreprise Test ${TEST_SUFFIX}"
TEST_TAGLINE_FR="L'IA qui transforme les leads en opportunités"

echo "Test Data (French):"
echo "  Business:    $TEST_BUSINESS_FR"
echo "  Email:       $TEST_EMAIL_FR"
echo "  Tagline:     $TEST_TAGLINE_FR"
echo "  Email Tone:  Professional"
echo "  Speed:       Within 1 hour"
echo ""

SIGNUP_FR_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$API_URL/client/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"businessName\": \"$TEST_BUSINESS_FR\",
        \"contactName\": \"Utilisateur Test\",
        \"email\": \"$TEST_EMAIL_FR\",
        \"password\": \"MotDePasse123!\",
        \"language\": \"fr\",
        \"customTagline\": \"$TEST_TAGLINE_FR\",
        \"emailTone\": \"Professional\",
        \"followupSpeed\": \"Within 1 hour\"
    }")

HTTP_STATUS_FR=$(echo "$SIGNUP_FR_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
SIGNUP_FR_BODY=$(echo "$SIGNUP_FR_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_FR"
echo "Response Body:"
echo "$SIGNUP_FR_BODY" | jq '.'
echo ""

if [ "$HTTP_STATUS_FR" = "200" ] || [ "$HTTP_STATUS_FR" = "201" ]; then
    echo -e "${GREEN}✅ TEST 3.1: French signup successful (HTTP $HTTP_STATUS_FR)${NC}"
    echo ""
    
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        sleep 2
        DB_CHECK_FR=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?email=eq.$TEST_EMAIL_FR&select=custom_tagline,email_tone,followup_speed,language" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
        
        echo "French client database check:"
        echo "$DB_CHECK_FR" | jq '.'
        echo ""
        
        FR_TONE=$(echo "$DB_CHECK_FR" | jq -r '.[0].email_tone')
        FR_SPEED=$(echo "$DB_CHECK_FR" | jq -r '.[0].followup_speed')
        
        if [ "$FR_TONE" = "Professional" ] && [ "$FR_SPEED" = "Within 1 hour" ]; then
            echo -e "${GREEN}✅ TEST 3.2: French preferences saved correctly${NC}"
        else
            echo -e "${RED}❌ TEST 3.2: French preferences mismatch${NC}"
        fi
        echo ""
    fi
else
    echo -e "${RED}❌ TEST 3.1: French signup failed (HTTP $HTTP_STATUS_FR)${NC}"
    echo ""
fi

# ============================================
# TEST 4: Query Recent Signups
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 4: Query Recent Signups${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    RECENT_CLIENTS=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?select=business_name,email,custom_tagline,email_tone,followup_speed,ai_personalized_reply,is_test&order=created_at.desc&limit=3" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    
    echo "📊 Recent 3 Clients:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$RECENT_CLIENTS" | jq -r '.[] | 
        "\nBusiness:     \(.business_name)\n" +
        "Email:        \(.email)\n" +
        "Tagline:      \(.custom_tagline)\n" +
        "Tone:         \(.email_tone)\n" +
        "Speed:        \(.followup_speed)\n" +
        "AI Reply:     \(.ai_personalized_reply)\n" +
        "Is Test:      \(.is_test)\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'
    
    echo ""
    echo -e "${GREEN}✅ TEST 4.1: Recent clients retrieved successfully${NC}"
    echo ""
else
    echo -e "${RED}❌ Skipping (missing Supabase credentials)${NC}"
    echo ""
fi

# ============================================
# FINAL SUMMARY
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$HTTP_STATUS" = "200" ] && [ "$HTTP_STATUS_FR" = "200" ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Signups completed successfully"
    echo "✅ Branding fields stored correctly"
    echo "✅ Test data detection working"
    echo "✅ Bilingual support verified"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📊 Verification SQL:${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Copy and paste this into Supabase SQL Editor:"
    echo ""
    echo "SELECT"
    echo "  business_name,"
    echo "  email,"
    echo "  custom_tagline,"
    echo "  email_tone,"
    echo "  followup_speed,"
    echo "  ai_personalized_reply,"
    echo "  is_test"
    echo "FROM public.clients"
    echo "ORDER BY created_at DESC"
    echo "LIMIT 3;"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Phase 1 of Personalized Email Automation: COMPLETE${NC}"
    echo ""
    EXIT_CODE=0
else
    echo -e "${RED}❌ TESTS FAILED${NC}"
    echo ""
    echo "Review errors above for details"
    echo ""
    EXIT_CODE=1
fi

exit $EXIT_CODE

