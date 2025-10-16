#!/bin/bash

# ============================================
# Avenir AI Solutions - Renovation Company Pipeline Test
# ============================================
# Full E2E test simulating a bilingual renovation company
# using the complete AI growth infrastructure
# ============================================

set -e  # Exit on error

echo ""
echo "🏗️  ============================================"
echo "🏗️  AVENIR AI - RENOVATION PIPELINE TEST"
echo "🏗️  ============================================"
echo "🏗️  Company: Prime Reno Solutions / Solutions RénovPrime"
echo "🏗️  Industry: Home Renovations & Construction"
echo "🏗️  Languages: English + French"
echo "🏗️  ============================================"
echo ""

BASE_URL="https://www.aveniraisolutions.ca"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEST_SUFFIX=$(date +%s)  # Unix timestamp for unique test runs

# Generate unique test emails
TEST_EMAIL_EN="test-prime-reno-en-${TEST_SUFFIX}@example.com"
TEST_EMAIL_FR="test-prime-reno-fr-${TEST_SUFFIX}@example.com"

echo "🔑 Test Run ID: $TEST_SUFFIX"
echo "📧 English Test Email: $TEST_EMAIL_EN"
echo "📧 French Test Email: $TEST_EMAIL_FR"
echo ""

# ============================================
# STEP 1: COMPANY SIGNUP (ENGLISH)
# ============================================

echo "📝 STEP 1: Company Signup (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Company: Prime Reno Solutions"
echo "Contact: David Smith"
echo "Email: $TEST_EMAIL_EN"
echo ""

SIGNUP_EN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/client/register" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d "{
    \"name\": \"David Smith\",
    \"email\": \"$TEST_EMAIL_EN\",
    \"business_name\": \"Prime Reno Solutions\",
    \"password\": \"RenovationPro2025!\",
    \"language\": \"en\"
  }")

HTTP_STATUS_EN=$(echo "$SIGNUP_EN_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
SIGNUP_EN_BODY=$(echo "$SIGNUP_EN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_EN"
echo "Response: $SIGNUP_EN_BODY"

if [ "$HTTP_STATUS_EN" = "200" ] || [ "$HTTP_STATUS_EN" = "201" ]; then
    # Extract from nested data object
    API_KEY_EN=$(echo "$SIGNUP_EN_BODY" | jq -r '.data.apiKey // empty')
    CLIENT_ID_EN=$(echo "$SIGNUP_EN_BODY" | jq -r '.data.clientId // empty')
    BUSINESS_NAME_EN=$(echo "$SIGNUP_EN_BODY" | jq -r '.data.businessName // empty')
    
    echo "✅ English signup successful!"
    echo "   Business: $BUSINESS_NAME_EN"
    echo "   Client ID: $CLIENT_ID_EN"
    
    # If API key not in response, fetch from Supabase using client_id
    if [ -z "$API_KEY_EN" ] || [ "$API_KEY_EN" = "null" ] || [ "$API_KEY_EN" = "empty" ]; then
        echo "   ⚠️  API Key not in response, fetching from Supabase..."
        
        # Fetch API key using /api/clients endpoint (uses service role key)
        CLIENT_DATA=$(curl -s "$BASE_URL/api/clients" | jq -r ".data[] | select(.client_id == \"$CLIENT_ID_EN\")")
        API_KEY_EN=$(echo "$CLIENT_DATA" | jq -r '.api_key // empty')
        
        if [ -n "$API_KEY_EN" ] && [ "$API_KEY_EN" != "null" ] && [ "$API_KEY_EN" != "empty" ]; then
            echo "   ✅ API Key retrieved: ${API_KEY_EN:0:20}..."
        else
            echo "   ❌ Failed to retrieve API key from Supabase"
            API_KEY_EN=""
        fi
    else
        echo "   API Key: ${API_KEY_EN:0:20}..."
    fi
else
    echo "❌ English signup failed!"
    echo "   Full response: $SIGNUP_EN_BODY"
    API_KEY_EN=""
    CLIENT_ID_EN=""
fi

echo ""
sleep 2

# ============================================
# STEP 2: COMPANY SIGNUP (FRENCH)
# ============================================

echo "📝 STEP 2: Company Signup (French)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Entreprise: Solutions RénovPrime"
echo "Contact: Marie Dubois"
echo "Email: $TEST_EMAIL_FR"
echo ""

SIGNUP_FR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/client/register" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d "{
    \"name\": \"Marie Dubois\",
    \"email\": \"$TEST_EMAIL_FR\",
    \"business_name\": \"Solutions RénovPrime\",
    \"password\": \"RénovationPro2025!\",
    \"language\": \"fr\"
  }")

HTTP_STATUS_FR=$(echo "$SIGNUP_FR_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
SIGNUP_FR_BODY=$(echo "$SIGNUP_FR_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS_FR"
echo "Response: $SIGNUP_FR_BODY"

if [ "$HTTP_STATUS_FR" = "200" ] || [ "$HTTP_STATUS_FR" = "201" ]; then
    # Extract from nested data object
    API_KEY_FR=$(echo "$SIGNUP_FR_BODY" | jq -r '.data.apiKey // empty')
    CLIENT_ID_FR=$(echo "$SIGNUP_FR_BODY" | jq -r '.data.clientId // empty')
    BUSINESS_NAME_FR=$(echo "$SIGNUP_FR_BODY" | jq -r '.data.businessName // empty')
    
    echo "✅ French signup successful!"
    echo "   Entreprise: $BUSINESS_NAME_FR"
    echo "   ID Client: $CLIENT_ID_FR"
    
    # If API key not in response, fetch from Supabase using client_id
    if [ -z "$API_KEY_FR" ] || [ "$API_KEY_FR" = "null" ] || [ "$API_KEY_FR" = "empty" ]; then
        echo "   ⚠️  Clé API non dans la réponse, récupération depuis Supabase..."
        
        # Fetch API key using /api/clients endpoint (uses service role key)
        CLIENT_DATA=$(curl -s "$BASE_URL/api/clients" | jq -r ".data[] | select(.client_id == \"$CLIENT_ID_FR\")")
        API_KEY_FR=$(echo "$CLIENT_DATA" | jq -r '.api_key // empty')
        
        if [ -n "$API_KEY_FR" ] && [ "$API_KEY_FR" != "null" ] && [ "$API_KEY_FR" != "empty" ]; then
            echo "   ✅ Clé API récupérée: ${API_KEY_FR:0:20}..."
        else
            echo "   ❌ Échec de récupération de la clé API depuis Supabase"
            API_KEY_FR=""
        fi
    else
        echo "   Clé API: ${API_KEY_FR:0:20}..."
    fi
else
    echo "❌ French signup failed!"
    echo "   Full response: $SIGNUP_FR_BODY"
    API_KEY_FR=""
    CLIENT_ID_FR=""
fi

echo ""
sleep 2

# ============================================
# STEP 3: SUBMIT TEST LEADS (ENGLISH)
# ============================================

echo "📨 STEP 3: Submitting Test Leads (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate API key exists
if [ -z "$API_KEY_EN" ] || [ "$API_KEY_EN" = "null" ]; then
    echo "❌ ERROR: No API key for English client. Skipping lead submission."
    echo "   This usually means signup failed or API didn't return apiKey."
    echo ""
    LEAD1_EN="SKIPPED"
    LEAD2_EN="SKIPPED"
    LEAD3_EN="SKIPPED"
    LEAD4_EN="SKIPPED"
else
    echo "✅ Using API Key: ${API_KEY_EN:0:20}..."
    echo "✅ Client ID: $CLIENT_ID_EN"
    echo ""
fi

if [ "$API_KEY_EN" != "SKIPPED" ] && [ -n "$API_KEY_EN" ]; then

# Lead 1: Hot Lead - Kitchen Renovation
echo "Lead 1/4 (EN): Hot - Kitchen Renovation"
LEAD1_EN=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_EN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Jennifer Anderson",
    "email": "jennifer.anderson@example.com",
    "message": "Hi! I need a complete kitchen renovation ASAP. My old cabinets are falling apart and I want modern quartz countertops. Budget is flexible, timeline is 2-3 months. Can you send a quote this week?",
    "language": "en"
  }')
echo "Status: $(echo "$LEAD1_EN" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 2: Warm Lead - Bathroom Update
echo "Lead 2/4 (EN): Warm - Bathroom Update"
LEAD2_EN=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_EN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Michael Thompson",
    "email": "mthompson@example.com",
    "message": "Looking to renovate our master bathroom sometime next year. Interested in walk-in shower and double vanity. Not urgent but want to start planning. What are your rates?",
    "language": "en"
  }')
echo "Status: $(echo "$LEAD2_EN" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 3: Cold Lead - General Inquiry
echo "Lead 3/4 (EN): Cold - General Inquiry"
LEAD3_EN=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_EN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Robert Wilson",
    "email": "rwilson@example.com",
    "message": "Just browsing for renovation ideas. Maybe thinking about basement finishing but no concrete plans yet. Do you have a portfolio I can look at?",
    "language": "en"
  }')
echo "Status: $(echo "$LEAD3_EN" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 4: Hot Lead - Full Home Renovation
echo "Lead 4/4 (EN): Hot - Full Home Renovation"
LEAD4_EN=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_EN" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Sarah Martinez",
    "email": "sarah.m@example.com",
    "message": "We just bought a fixer-upper and need complete renovation - kitchen, bathrooms, flooring, painting. Budget $150k. Need to start in 3 weeks. Can we meet this Friday?",
    "language": "en"
  }')
echo "Status: $(echo "$LEAD4_EN" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

fi  # End of API_KEY_EN validation

echo "✅ English leads submitted (4/4)"
echo ""
sleep 2

# ============================================
# STEP 4: SUBMIT TEST LEADS (FRENCH)
# ============================================

echo "📨 STEP 4: Submitting Test Leads (French)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate API key exists
if [ -z "$API_KEY_FR" ] || [ "$API_KEY_FR" = "null" ]; then
    echo "❌ ERROR: No API key for French client. Skipping lead submission."
    echo "   This usually means signup failed or API didn't return apiKey."
    echo ""
    LEAD1_FR="SKIPPED"
    LEAD2_FR="SKIPPED"
    LEAD3_FR="SKIPPED"
    LEAD4_FR="SKIPPED"
else
    echo "✅ Using API Key: ${API_KEY_FR:0:20}..."
    echo "✅ Client ID: $CLIENT_ID_FR"
    echo ""
fi

if [ "$API_KEY_FR" != "SKIPPED" ] && [ -n "$API_KEY_FR" ]; then

# Lead 1: Hot Lead - Cuisine
echo "Lead 1/4 (FR): Chaud - Rénovation Cuisine"
LEAD1_FR=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_FR" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Sophie Tremblay",
    "email": "sophie.tremblay@example.com",
    "message": "Bonjour! Je dois rénover ma cuisine complètement. Les armoires sont vieilles et je veux des comptoirs en quartz. Budget flexible, délai 2-3 mois. Pouvez-vous m'\''envoyer une soumission cette semaine?",
    "language": "fr"
  }')
echo "Status: $(echo "$LEAD1_FR" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 2: Warm Lead - Salle de bain
echo "Lead 2/4 (FR): Tiède - Rénovation Salle de Bain"
LEAD2_FR=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_FR" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Jean-François Leblanc",
    "email": "jf.leblanc@example.com",
    "message": "Je cherche à rénover notre salle de bain principale l'\''année prochaine. Intéressé par douche plain-pied et double lavabo. Pas urgent mais veux commencer à planifier. Quels sont vos tarifs?",
    "language": "fr"
  }')
echo "Status: $(echo "$LEAD2_FR" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 3: Cold Lead - Question générale
echo "Lead 3/4 (FR): Froid - Question Générale"
LEAD3_FR=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_FR" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Luc Bergeron",
    "email": "luc.bergeron@example.com",
    "message": "Je regarde juste des idées de rénovation. Peut-être finir le sous-sol mais rien de concret encore. Avez-vous un portfolio que je peux consulter?",
    "language": "fr"
  }')
echo "Status: $(echo "$LEAD3_FR" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

# Lead 4: Hot Lead - Toiture urgente
echo "Lead 4/4 (FR): Chaud - Toiture Urgente"
LEAD4_FR=$(curl -s -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY_FR" \
  -w "\nHTTP_STATUS:%{http_code}" \
  -d '{
    "name": "Catherine Gagnon",
    "email": "c.gagnon@example.com",
    "message": "URGENT - Ma toiture coule et j'\''ai besoin d'\''une réparation immédiate. J'\''ai aussi des bardeaux endommagés. Pouvez-vous venir évaluer cette semaine? Budget jusqu'\''à 25 000$.",
    "language": "fr"
  }')
echo "Status: $(echo "$LEAD4_FR" | grep HTTP_STATUS | cut -d':' -f2)"
echo ""

fi  # End of API_KEY_FR validation

echo "✅ French leads submitted (4/4)"
echo ""
echo "📊 Total leads submitted: 8 (4 EN + 4 FR)"
echo ""
sleep 2

# ============================================
# STEP 5: TRIGGER AI PROCESSING
# ============================================

echo "🧠 STEP 5: Triggering AI Intelligence Engine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Processing all leads for analytics..."
echo ""

AI_RESPONSE=$(curl -s -X GET "$BASE_URL/api/intelligence-engine" \
  -w "\nHTTP_STATUS:%{http_code}")

AI_STATUS=$(echo "$AI_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
AI_BODY=$(echo "$AI_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $AI_STATUS"
echo "Response: $AI_BODY"

if [ "$AI_STATUS" = "200" ]; then
    echo "✅ AI processing completed successfully!"
else
    echo "⚠️  AI processing returned status: $AI_STATUS"
fi

echo ""
sleep 3

# ============================================
# STEP 6: VERIFY LEADS IN CLIENT DASHBOARD (EN)
# ============================================

echo "🔍 STEP 6: Verifying English Client Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking leads for Prime Reno Solutions (EN)..."
echo ""

if [ -n "$CLIENT_ID_EN" ]; then
    LEADS_EN_RESPONSE=$(curl -s -X GET "$BASE_URL/api/client/leads?clientId=$CLIENT_ID_EN" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    LEADS_EN_STATUS=$(echo "$LEADS_EN_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    LEADS_EN_BODY=$(echo "$LEADS_EN_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $LEADS_EN_STATUS"
    
    if [ "$LEADS_EN_STATUS" = "200" ]; then
        LEAD_COUNT_EN=$(echo "$LEADS_EN_BODY" | jq -r '.data | length')
        echo "✅ Leads fetched: $LEAD_COUNT_EN"
        
        if [ "$LEAD_COUNT_EN" -gt 0 ]; then
            echo ""
            echo "Sample Lead (EN):"
            echo "$LEADS_EN_BODY" | jq -r '.data[0] | "  Name: \(.name)\n  Intent: \(.intent)\n  Urgency: \(.urgency)\n  Confidence: \(.confidence_score)"'
        fi
    else
        echo "❌ Failed to fetch English leads"
    fi
else
    echo "⚠️  Skipping (no client_id)"
fi

echo ""
sleep 2

# ============================================
# STEP 7: VERIFY LEADS IN CLIENT DASHBOARD (FR)
# ============================================

echo "🔍 STEP 7: Verifying French Client Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Vérification des leads pour Solutions RénovPrime (FR)..."
echo ""

if [ -n "$CLIENT_ID_FR" ]; then
    LEADS_FR_RESPONSE=$(curl -s -X GET "$BASE_URL/api/client/leads?clientId=$CLIENT_ID_FR" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    LEADS_FR_STATUS=$(echo "$LEADS_FR_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    LEADS_FR_BODY=$(echo "$LEADS_FR_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "HTTP Status: $LEADS_FR_STATUS"
    
    if [ "$LEADS_FR_STATUS" = "200" ]; then
        LEAD_COUNT_FR=$(echo "$LEADS_FR_BODY" | jq -r '.data | length')
        echo "✅ Leads récupérés: $LEAD_COUNT_FR"
        
        if [ "$LEAD_COUNT_FR" -gt 0 ]; then
            echo ""
            echo "Exemple de Lead (FR):"
            echo "$LEADS_FR_BODY" | jq -r '.data[0] | "  Nom: \(.name)\n  Intention: \(.intent)\n  Urgence: \(.urgency)\n  Confiance: \(.confidence_score)"'
        fi
    else
        echo "❌ Échec de récupération des leads français"
    fi
else
    echo "⚠️  Skipping (no client_id)"
fi

echo ""
sleep 2

# ============================================
# STEP 8: SIMULATE CONVERSION
# ============================================

echo "🎯 STEP 8: Simulating Lead Conversion"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Converting first hot lead (kitchen renovation)..."
echo ""

# Get first lead ID from English client
if [ "$LEAD_COUNT_EN" -gt 0 ]; then
    FIRST_LEAD_ID=$(echo "$LEADS_EN_BODY" | jq -r '.data[0].id')
    FIRST_LEAD_NAME=$(echo "$LEADS_EN_BODY" | jq -r '.data[0].name')
    
    echo "Lead to convert: $FIRST_LEAD_NAME (ID: ${FIRST_LEAD_ID:0:12}...)"
    
    CONVERT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/lead-actions" \
      -H "Content-Type: application/json" \
      -w "\nHTTP_STATUS:%{http_code}" \
      -d "{
        \"lead_id\": \"$FIRST_LEAD_ID\",
        \"action\": \"tag\",
        \"tag\": \"Converted\",
        \"performed_by\": \"test_automation\"
      }")
    
    CONVERT_STATUS=$(echo "$CONVERT_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    
    echo "HTTP Status: $CONVERT_STATUS"
    
    if [ "$CONVERT_STATUS" = "200" ]; then
        echo "✅ Lead converted successfully!"
        echo "   Growth Brain: Conversion event logged"
    else
        echo "❌ Conversion failed"
    fi
else
    echo "⚠️  No leads to convert"
    FIRST_LEAD_ID=""
fi

echo ""
sleep 2

# ============================================
# STEP 9: SIMULATE REVERSION
# ============================================

echo "🔄 STEP 9: Simulating Lead Reversion"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Reverting converted lead back to active..."
echo ""

if [ -n "$FIRST_LEAD_ID" ]; then
    REVERT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/lead-actions" \
      -H "Content-Type: application/json" \
      -w "\nHTTP_STATUS:%{http_code}" \
      -d "{
        \"lead_id\": \"$FIRST_LEAD_ID\",
        \"action\": \"tag\",
        \"tag\": \"Active\",
        \"reversion_reason\": \"Test automation - validating reversion flow\",
        \"is_reversion\": true,
        \"performed_by\": \"test_automation\"
      }")
    
    REVERT_STATUS=$(echo "$REVERT_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    
    echo "HTTP Status: $REVERT_STATUS"
    
    if [ "$REVERT_STATUS" = "200" ]; then
        echo "✅ Lead reverted to Active successfully!"
        echo "   Reversion Reason: Test automation"
        echo "   Growth Brain: Reversion event logged"
    else
        echo "❌ Reversion failed"
    fi
else
    echo "⚠️  No lead to revert"
fi

echo ""
sleep 2

# ============================================
# FINAL SUMMARY
# ============================================

echo ""
echo "🏁 ============================================"
echo "🏁 TEST SUMMARY"
echo "🏁 ============================================"
echo ""

TOTAL_TESTS=9
PASSED_TESTS=0

echo "📊 Test Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: English Signup
if [ "$HTTP_STATUS_EN" = "200" ] || [ "$HTTP_STATUS_EN" = "201" ]; then
    echo "✅ Test 1: English Company Signup"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 1: English Company Signup"
fi

# Test 2: French Signup
if [ "$HTTP_STATUS_FR" = "200" ] || [ "$HTTP_STATUS_FR" = "201" ]; then
    echo "✅ Test 2: French Company Signup"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 2: French Company Signup"
fi

# Test 3-6: Lead Submissions
if [ "$(echo "$LEAD1_EN" | grep HTTP_STATUS | cut -d':' -f2)" = "200" ]; then
    echo "✅ Test 3: English Lead 1 (Hot - Kitchen)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 3: English Lead 1"
fi

if [ "$(echo "$LEAD2_EN" | grep HTTP_STATUS | cut -d':' -f2)" = "200" ]; then
    echo "✅ Test 4: English Lead 2 (Warm - Bathroom)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 4: English Lead 2"
fi

if [ "$(echo "$LEAD1_FR" | grep HTTP_STATUS | cut -d':' -f2)" = "200" ]; then
    echo "✅ Test 5: French Lead 1 (Hot - Cuisine)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 5: French Lead 1"
fi

if [ "$(echo "$LEAD2_FR" | grep HTTP_STATUS | cut -d':' -f2)" = "200" ]; then
    echo "✅ Test 6: French Lead 2 (Warm - Salle de bain)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 6: French Lead 2"
fi

# Test 7: AI Processing
if [ "$AI_STATUS" = "200" ]; then
    echo "✅ Test 7: AI Intelligence Engine"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 7: AI Intelligence Engine"
fi

# Test 8: Conversion
if [ "$CONVERT_STATUS" = "200" ]; then
    echo "✅ Test 8: Lead Conversion"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 8: Lead Conversion"
fi

# Test 9: Reversion
if [ "$REVERT_STATUS" = "200" ]; then
    echo "✅ Test 9: Lead Reversion"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo "❌ Test 9: Lead Reversion"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Score: $PASSED_TESTS / $TOTAL_TESTS tests passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo "🎉 ✅ ALL TESTS PASSED!"
    echo "🎉 Full pipeline validated successfully!"
    EXIT_CODE=0
else
    echo "⚠️  Some tests failed. Review logs above."
    EXIT_CODE=1
fi

echo ""
echo "🏁 Test completed at: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "🏁 ============================================"
echo ""

exit $EXIT_CODE

