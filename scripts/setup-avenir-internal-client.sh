#!/bin/bash

# ============================================
# Setup Avenir AI Solutions as Internal Client
# ============================================
# This script adds Avenir AI Solutions to the clients table
# so marketing site leads can be tracked in the admin dashboard

set -e  # Exit on error

echo "🏢 ============================================"
echo "🏢 Avenir AI Solutions Internal Client Setup"
echo "🏢 ============================================"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env.local"
else
    echo "❌ .env.local not found. Please create it with your Supabase credentials."
    exit 1
fi

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   NEXT_PUBLIC_SUPABASE_URL"
    echo "   SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "🔗 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# ============================================
# STEP 1: Apply SQL Migration
# ============================================

echo "📝 STEP 1: Applying SQL Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SQL_FILE="supabase/migrations/add_avenir_internal_client.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL migration file not found: $SQL_FILE"
    exit 1
fi

echo "📄 Reading SQL from: $SQL_FILE"
SQL_CONTENT=$(cat "$SQL_FILE")

# Execute SQL via Supabase REST API
RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

echo "Response: $RESPONSE"
echo ""

# Alternative: Direct INSERT via REST API (simpler approach)
echo "📝 Inserting Avenir AI Solutions record..."
echo ""

INSERT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=ignore-duplicates" \
    -d '{
        "client_id": "avenir-internal-client",
        "business_name": "Avenir AI Solutions",
        "name": "Avenir Team",
        "email": "info@aveniraisolutions.ca",
        "contact_name": "Avenir Team",
        "password_hash": "$2a$10$placeholder.hash.not.used.for.login",
        "language": "en",
        "api_key": "internal-avenir-key-do-not-use-externally",
        "is_internal": true
    }')

HTTP_STATUS=$(echo "$INSERT_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$INSERT_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $BODY"
echo ""

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Avenir AI Solutions added successfully!"
elif [ "$HTTP_STATUS" = "409" ]; then
    echo "✅ Avenir AI Solutions already exists (skipped)"
else
    echo "⚠️  Unexpected response. Check if record was created."
fi

echo ""

# ============================================
# STEP 2: Verify Record
# ============================================

echo "🔍 STEP 2: Verifying Client Record"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

VERIFY_RESPONSE=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?client_id=eq.avenir-internal-client&select=*" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json")

echo "Query Response:"
echo "$VERIFY_RESPONSE" | jq '.'

RECORD_COUNT=$(echo "$VERIFY_RESPONSE" | jq 'length')

if [ "$RECORD_COUNT" -eq 1 ]; then
    echo ""
    echo "✅ Avenir AI Solutions client record verified!"
    echo ""
    echo "📊 Client Details:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$VERIFY_RESPONSE" | jq -r '.[0] | 
        "   Client ID:     \(.client_id)\n" +
        "   Business Name: \(.business_name)\n" +
        "   Contact Name:  \(.name)\n" +
        "   Email:         \(.email)\n" +
        "   Language:      \(.language)\n" +
        "   Created:       \(.created_at)"'
    echo ""
else
    echo "❌ Verification failed. Record not found or multiple records exist."
    echo "   Expected: 1 record"
    echo "   Found: $RECORD_COUNT records"
    exit 1
fi

# ============================================
# STEP 3: Summary
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ What was done:"
echo "   1. Created 'Avenir AI Solutions' client record"
echo "   2. Client ID: avenir-internal-client"
echo "   3. All marketing site leads will now link to this client"
echo ""
echo "📍 Next Steps:"
echo "   1. Go to your admin dashboard: https://www.aveniraisolutions.ca/en/dashboard"
echo "   2. Select 'Avenir AI Solutions' in the Client Filter dropdown"
echo "   3. View all leads from your marketing site"
echo ""
echo "🧪 Test Lead Submission:"
echo "   - Visit: https://www.aveniraisolutions.ca/en"
echo "   - Submit a test lead via the contact form"
echo "   - Check admin dashboard → filter by 'Avenir AI Solutions'"
echo "   - Your test lead should appear!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All marketing site leads are now tracked!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

