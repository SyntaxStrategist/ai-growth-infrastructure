const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateScriptPDFs() {
  const browser = await puppeteer.launch();
  
  try {
    // Generate English PDF
    const page1 = await browser.newPage();
    const englishHtmlPath = path.join(__dirname, 'AVENIR_VIDEO_SCRIPT_EN.html');
    const englishHtmlContent = fs.readFileSync(englishHtmlPath, 'utf8');
    
    await page1.setContent(englishHtmlContent, { waitUntil: 'domcontentloaded' });
    await page1.pdf({
      path: 'AVENIR_VIDEO_SCRIPT_EN.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; margin-top: 10px;">
          Avenir AI Video Script - English
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; margin-bottom: 10px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });
    await page1.close();
    console.log('✅ English script PDF generated: AVENIR_VIDEO_SCRIPT_EN.pdf');
    
    // Generate French PDF
    const page2 = await browser.newPage();
    const frenchHtmlPath = path.join(__dirname, 'AVENIR_VIDEO_SCRIPT_FR.html');
    const frenchHtmlContent = fs.readFileSync(frenchHtmlPath, 'utf8');
    
    await page2.setContent(frenchHtmlContent, { waitUntil: 'domcontentloaded' });
    await page2.pdf({
      path: 'AVENIR_VIDEO_SCRIPT_FR.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; margin-top: 10px;">
          Script Vidéo Avenir AI - Français
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; margin-bottom: 10px;">
          Page <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      `
    });
    await page2.close();
    console.log('✅ French script PDF generated: AVENIR_VIDEO_SCRIPT_FR.pdf');
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
  } finally {
    await browser.close();
    console.log('🎉 Both video script PDFs generated successfully!');
  }
}

generateScriptPDFs();
