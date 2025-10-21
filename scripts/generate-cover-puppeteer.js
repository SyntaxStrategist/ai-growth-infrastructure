// Generate cover photo using Puppeteer
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateCover() {
  console.log('🚀 Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to exact cover dimensions
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2 // High DPI for better quality
  });
  
  console.log('📄 Loading template...');
  
  const htmlPath = path.join(__dirname, '../temp/cover-template.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });
  
  // Wait for animations to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('📸 Taking screenshot...');
  
  const outputPath = path.join(__dirname, '../public/assets/logos/avenir-cover.png');
  
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  
  console.log('✅ Cover photo generated successfully!');
  console.log(`📁 Saved to: ${outputPath}`);
  
  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  console.log(`📊 File size: ${fileSizeKB} KB`);
  console.log('\n🎉 Done! Your cover photo is ready to use.');
}

generateCover()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

