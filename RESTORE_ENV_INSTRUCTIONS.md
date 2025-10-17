# Restore .env.local Instructions

## ⚠️ What Happened

I accidentally overwrote your `.env.local` file by running `cp env.example .env.local`. This replaced your configured environment variables with the empty template.

**I've now deleted the template copy** so you can restore your original file.

---

## 🔄 How to Restore Your Original .env.local

### Option 1: Time Machine (macOS Backup)

If you have Time Machine enabled:

```bash
# 1. Open Time Machine
# 2. Navigate to your project directory
# 3. Browse to before Oct 17, 13:36
# 4. Restore .env.local file
```

Or via command line:
```bash
# Enter Time Machine via tmutil
tmutil listlocalsnapshots /
# Find snapshot before 13:36 today
# Restore file from snapshot
```

---

### Option 2: VS Code / Cursor Local History

If you're using VS Code or Cursor with local history:

**VS Code:**
1. Right-click on the project folder
2. Select "Local History" → "Find Entry..."
3. Look for `.env.local` before Oct 17, 13:36
4. Restore the file

**Cursor:**
1. Check if there's an automatic backup in Cursor's cache
2. Look in: `~/Library/Application Support/Cursor/Backups/`

---

### Option 3: System-Wide Search for Backup

```bash
# Search for any .env.local copies in your home directory
find ~ -name ".env.local*" -o -name "env.local*" 2>/dev/null | grep -v node_modules

# Check Downloads folder for exported env files
ls -lat ~/Downloads/*.env* ~/Downloads/*.txt 2>/dev/null | head -10

# Check Desktop for any exported configs
ls -lat ~/Desktop/*.env* ~/Desktop/*.txt 2>/dev/null | head -10
```

---

### Option 4: Reconstruct from Memory/Documentation

If you can't find a backup, you'll need to reconstruct the file. You need these key variables:

**Required Variables:**
```bash
# Supabase (from https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (service_role secret key)
SUPABASE_ANON_KEY=eyJhbG... (anon public key)
SUPABASE_URL=https://[your-project].supabase.co  # Same as NEXT_PUBLIC_SUPABASE_URL
SUPABASE_KEY=[service_role key]  # Same as SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL=${SUPABASE_URL}

# Admin password
ADMIN_PASSWORD=your_admin_password

# OpenAI (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Gmail (if configured)
GMAIL_CREDENTIALS_JSON={"type": "service_account",...}
GMAIL_REFRESH_TOKEN=...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_ENCRYPTION_KEY=...

# Google Sheets (if configured)
GOOGLE_CREDENTIALS_JSON=...
GOOGLE_SHEETS_ID=...

# Site URL (if configured)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## ✅ Once You Restore Your .env.local

### Add APOLLO_API_KEY

Simply add this line at the bottom of your restored file:

```bash
# ==================== APOLLO ====================
# Apollo API Key for prospect discovery (https://apollo.io)
# Free tier: 50 requests/hour
# Get your key from: https://app.apollo.io/#/settings/integrations/api
APOLLO_API_KEY=your_apollo_key_here
```

**That's it!** No other changes needed to your original file.

---

## 🚨 Prevention for Future

To prevent this from happening again:

**Option 1: Create a backup before changes**
```bash
# Before making env changes
cp .env.local .env.local.backup
```

**Option 2: Version control alternative**
```bash
# Create a tracked template with fake values
cp .env.local .env.local.template
# Replace real values with placeholders
# Commit .env.local.template to git
```

**Option 3: Use env file encryption**
```bash
# Encrypt and commit
git-crypt init
echo ".env.local" >> .gitattributes
git-crypt lock
```

---

## 🔍 What to Look For in Your Original File

Your original `.env.local` likely had:

1. **Real Supabase URLs** (not empty)
   - Format: `https://abcdefghijklmnop.supabase.co`
   
2. **Real API Keys** (long strings starting with `eyJhbG...` or `sk-...`)
   
3. **Admin password** (your actual password)

4. **Possibly Gmail credentials** (JSON format)

5. **Possibly other custom configurations**

---

## 💡 Immediate Help

If you need help reconstructing your `.env.local`:

1. **Supabase values:**
   - Log into https://app.supabase.com
   - Go to your project → Settings → API
   - Copy: Project URL, anon key, service_role key

2. **OpenAI key:**
   - Log into https://platform.openai.com
   - API Keys section
   - Copy your key (or create new one)

3. **Admin password:**
   - Any secure password you want to use
   - Will be used for admin dashboard login

---

## 📝 After Restoration

Once you've restored your `.env.local` with the original values:

```bash
# 1. Verify it has your real values
grep -E "SUPABASE_URL|OPENAI_API_KEY|ADMIN_PASSWORD" .env.local | sed 's/=.*/=***/'

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=***
# SUPABASE_SERVICE_ROLE_KEY=***
# OPENAI_API_KEY=***
# ADMIN_PASSWORD=***

# 2. Add Apollo key at the bottom
echo "" >> .env.local
echo "# ==================== APOLLO ====================" >> .env.local
echo "# Apollo API Key for prospect discovery" >> .env.local
echo "APOLLO_API_KEY=your_apollo_key_here" >> .env.local

# 3. Restart server
npm run dev
```

---

**I apologize for this mistake.** I should have checked for an existing `.env.local` before copying over it. Once you restore your original file, just add the APOLLO_API_KEY line at the bottom and everything will work perfectly! 🙏

