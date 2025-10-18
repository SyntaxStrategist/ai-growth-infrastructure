const puppeteer = require('puppeteer');
const path = require('path');

async function generateSalesAssetsPDF() {
  console.log('🎨 Starting Avenir AI Sales Assets PDF generation...');
  
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
    
    // Generate English PDF
    console.log('📄 Generating English one-pager...');
    const englishHtmlPath = path.resolve(__dirname, 'AvenirAI_Overview_EN.html');
    await page.goto(`file://${englishHtmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    const englishPdf = await page.pdf({
      path: 'AvenirAI_Overview_EN.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    
    console.log('✅ English PDF generated successfully!');
    
    // Generate French PDF
    console.log('📄 Generating French one-pager...');
    const frenchHtmlPath = path.resolve(__dirname, 'AvenirAI_Overview_FR.html');
    await page.goto(`file://${frenchHtmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    const frenchPdf = await page.pdf({
      path: 'AvenirAI_Overview_FR.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });
    
    console.log('✅ French PDF generated successfully!');
    console.log('📁 Files saved as:');
    console.log('   • AvenirAI_Overview_EN.pdf');
    console.log('   • AvenirAI_Overview_FR.pdf');
    
    return { englishPdf, frenchPdf };
    
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the PDF generation
generateSalesAssetsPDF()
  .then(() => {
    console.log('🎯 Sales Assets PDF generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 PDF generation failed:', error);
    process.exit(1);
  });
