const bcrypt = require('bcryptjs');

async function fixHash() {
  const password = 'Silver4evermore!';
  console.log('🔧 Generating new hash for admin password...');
  
  const hash = await bcrypt.hash(password, 10);
  console.log('\n✅ New hash generated:');
  console.log(hash);
  console.log('\nCopy this to ADMIN_PASSWORD_HASH in .env.local');
}

fixHash();
