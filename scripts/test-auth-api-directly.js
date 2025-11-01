async function testAuth() {
  console.log('🧪 Testing auth API directly...\n');
  
  const response = await fetch('http://localhost:3000/api/client/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'iammikeoni879+test221001@gmail.com',
      password: 'ballislife'
    })
  });
  
  const data = await response.json();
  
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

testAuth();
