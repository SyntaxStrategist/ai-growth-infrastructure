const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  try {
    console.log('🚀 Starting PDF generation...');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Read HTML file
    const htmlPath = path.join(__dirname, 'AVENIR_AI_REALISTIC_VALUATION_2PAGE.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'AVENIR_AI_REALISTIC_VALUATION_2PAGE.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully: AVENIR_AI_REALISTIC_VALUATION_2PAGE.pdf');
    console.log(`📄 File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer');
  generatePDF();
} catch (e) {
  console.log('❌ Puppeteer not installed. Installing...');
  console.log('Run: npm install puppeteer');
  console.log('Then run this script again.');
  process.exit(1);
}
