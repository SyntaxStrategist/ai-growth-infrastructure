const puppeteer = require('puppeteer');
const path = require('path');

async function generateBrandKitPDF() {
  console.log('🎨 Starting Avenir AI Solutions Brand Kit PDF generation...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Load the HTML file
    const htmlPath = path.resolve(__dirname, 'Avenir_AI_Solutions_Brand_Kit.html');
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    console.log('📄 HTML loaded, generating PDF...');
    
    // Generate PDF with high quality settings
    const pdf = await page.pdf({
      path: 'Avenir_AI_Solutions_Brand_Kit.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    
    console.log('✅ Brand Kit PDF generated successfully!');
    console.log('📁 File saved as: Avenir_AI_Solutions_Brand_Kit.pdf');
    
    return pdf;
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the PDF generation
generateBrandKitPDF()
  .then(() => {
    console.log('🎯 Brand Kit PDF generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 PDF generation failed:', error);
    process.exit(1);
  });
