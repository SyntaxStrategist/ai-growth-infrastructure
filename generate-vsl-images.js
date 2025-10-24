const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateVSLImages() {
  const browser = await puppeteer.launch();
  
  try {
    // Generate English PNG
    const page1 = await browser.newPage();
    const englishHtmlPath = path.join(__dirname, 'Avenir_AI_Client_OnePager_Compact.html');
    const englishHtmlContent = fs.readFileSync(englishHtmlPath, 'utf8');
    
    await page1.setContent(englishHtmlContent, { waitUntil: 'domcontentloaded' });
    await page1.setViewport({ width: 1920, height: 1080 }); // HD resolution for video
    await page1.screenshot({
      path: 'Avenir_AI_Client_OnePager_EN.png',
      fullPage: false,
      type: 'png'
    });
    await page1.close();
    console.log('✅ English PNG generated: Avenir_AI_Client_OnePager_EN.png');
    
    // Generate French PNG
    const page2 = await browser.newPage();
    const frenchHtmlPath = path.join(__dirname, 'Avenir_AI_Client_OnePager_Compact_FR.html');
    const frenchHtmlContent = fs.readFileSync(frenchHtmlPath, 'utf8');
    
    await page2.setContent(frenchHtmlContent, { waitUntil: 'domcontentloaded' });
    await page2.setViewport({ width: 1920, height: 1080 }); // HD resolution for video
    await page2.screenshot({
      path: 'Avenir_AI_Client_OnePager_FR.png',
      fullPage: false,
      type: 'png'
    });
    await page2.close();
    console.log('✅ French PNG generated: Avenir_AI_Client_OnePager_FR.png');
    
  } catch (error) {
    console.error('Error generating images:', error);
  } finally {
    await browser.close();
    console.log('🎉 Both VSL-ready images generated successfully!');
    console.log('📹 These PNG files can be imported directly into Canva for video creation');
  }
}

generateVSLImages();
