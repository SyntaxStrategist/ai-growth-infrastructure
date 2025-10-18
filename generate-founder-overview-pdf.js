const fs = require('fs');
const path = require('path');

// Check if puppeteer is available
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('❌ Puppeteer not found. Installing...');
  console.log('Please run: npm install puppeteer');
  console.log('Then run this script again.');
  process.exit(1);
}

async function generatePDF() {
  console.log('🚀 Generating Avenir AI System Overview PDF...');
  
  try {
    // Read the HTML file
    const htmlPath = path.join(__dirname, 'Avenir_AI_System_Overview_Founder_Edition.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    console.log('✅ HTML file loaded successfully');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'Avenir_AI_System_Overview_Founder_Edition.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 File saved as: ${pdfPath}`);
    console.log('');
    console.log('🎯 The PDF is ready for presentation and sharing!');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

// Run the generation
generatePDF();
