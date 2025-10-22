const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(htmlFile, pdfFile) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Read the HTML file
  const htmlContent = fs.readFileSync(htmlFile, 'utf8');
  
  // Set content with base URL for asset loading
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });

  // Generate PDF with settings
  await page.pdf({
    path: pdfFile,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    preferCSSPageSize: true
  });

  await browser.close();
  console.log(`✅ Generated: ${pdfFile}`);
}

async function main() {
  try {
    console.log('🚀 Generating client guide PDFs...\n');
    
    // Generate English PDF
    await generatePDF(
      path.join(__dirname, 'AVENIR_CLIENT_GUIDE_EN.html'),
      path.join(__dirname, 'AVENIR_CLIENT_GUIDE_EN.pdf')
    );
    
    // Generate French PDF if it exists
    const frHtmlPath = path.join(__dirname, 'AVENIR_CLIENT_GUIDE_FR.html');
    if (fs.existsSync(frHtmlPath)) {
      await generatePDF(
        frHtmlPath,
        path.join(__dirname, 'AVENIR_CLIENT_GUIDE_FR.pdf')
      );
    }
    
    console.log('\n✨ All PDFs generated successfully!');
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  }
}

main();

