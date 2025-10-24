const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateFixedImages() {
  const browser = await puppeteer.launch();
  
  try {
    // Generate English PNG with logo
    const page1 = await browser.newPage();
    const englishHtmlPath = path.join(__dirname, 'Avenir_AI_Client_OnePager_Compact.html');
    const englishHtmlContent = fs.readFileSync(englishHtmlPath, 'utf8');
    
    await page1.setContent(englishHtmlContent, { waitUntil: 'domcontentloaded' });
    await page1.setViewport({ width: 1920, height: 1080 });
    await page1.screenshot({
      path: 'Avenir_AI_Client_OnePager_EN_WithLogo.png',
      fullPage: false,
      type: 'png'
    });
    await page1.close();
    console.log('✅ English PNG with logo generated: Avenir_AI_Client_OnePager_EN_WithLogo.png');
    
    // Generate French PNG with logo
    const page2 = await browser.newPage();
    const frenchHtmlPath = path.join(__dirname, 'Avenir_AI_Client_OnePager_Compact_FR.html');
    const frenchHtmlContent = fs.readFileSync(frenchHtmlPath, 'utf8');
    
    await page2.setContent(frenchHtmlContent, { waitUntil: 'domcontentloaded' });
    await page2.setViewport({ width: 1920, height: 1080 });
    await page2.screenshot({
      path: 'Avenir_AI_Client_OnePager_FR_WithLogo.png',
      fullPage: false,
      type: 'png'
    });
    await page2.close();
    console.log('✅ French PNG with logo generated: Avenir_AI_Client_OnePager_FR_WithLogo.png');
    
  } catch (error) {
    console.error('Error generating images:', error);
  } finally {
    await browser.close();
    console.log('🎉 Both VSL-ready images with logos generated successfully!');
  }
}

generateFixedImages();
