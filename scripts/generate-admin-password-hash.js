#!/usr/bin/env node

/**
 * Generate Admin Password Hash
 * 
 * This script generates a bcrypt hash for the admin password.
 * Run: node scripts/generate-admin-password-hash.js
 * 
 * Then copy the hash to your .env.local as ADMIN_PASSWORD_HASH
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('='.repeat(60));
  console.log('🔐 Admin Password Hash Generator');
  console.log('='.repeat(60));
  console.log('');
  console.log('This will generate a secure bcrypt hash for your admin password.');
  console.log('The hash will be used in ADMIN_PASSWORD_HASH environment variable.');
  console.log('');
  
  rl.question('Enter your admin password: ', async (password) => {
    if (!password || password.length < 8) {
      console.error('');
      console.error('❌ Password must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }
    
    console.log('');
    console.log('⏳ Generating hash (this may take a few seconds)...');
    
    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      
      console.log('');
      console.log('✅ Hash generated successfully!');
      console.log('');
      console.log('='.repeat(60));
      console.log('📋 Copy this to your .env.local file:');
      console.log('='.repeat(60));
      console.log('');
      console.log(`ADMIN_PASSWORD_HASH=${hash}`);
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('📝 Instructions:');
      console.log('1. Copy the line above');
      console.log('2. Open your .env.local file');
      console.log('3. Replace ADMIN_PASSWORD with ADMIN_PASSWORD_HASH');
      console.log('4. Paste the new line');
      console.log('5. Save and restart your dev server');
      console.log('');
      console.log('⚠️  For Vercel deployment:');
      console.log('   Add ADMIN_PASSWORD_HASH in Vercel dashboard → Settings → Environment Variables');
      console.log('');
      console.log('🔒 Security: Never commit this hash to Git');
      console.log('');
      
    } catch (error) {
      console.error('');
      console.error('❌ Error generating hash:', error);
      process.exit(1);
    }
    
    rl.close();
  });
}

main().catch(console.error);

