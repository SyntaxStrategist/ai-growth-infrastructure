const puppeteer = require('puppeteer');
const path = require('path');

async function generatePitchPDFs() {
  console.log('🚀 Starting PDF generation for Avenir AI Pitch...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Generate English PDF
    console.log('📄 Generating English PDF...');
    const pageEN = await browser.newPage();
    const htmlPathEN = path.join(__dirname, 'AVENIR_AI_PITCH_EN.html');
    await pageEN.goto(`file://${htmlPathEN}`, {
      waitUntil: 'networkidle0'
    });
    
    const pdfPathEN = path.join(__dirname, 'AVENIR_AI_PITCH_EN.pdf');
    await pageEN.pdf({
      path: pdfPathEN,
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    console.log('✅ English PDF saved:', pdfPathEN);
    await pageEN.close();

    // Generate French PDF
    console.log('📄 Generating French PDF...');
    const pageFR = await browser.newPage();
    const htmlPathFR = path.join(__dirname, 'AVENIR_AI_PITCH_FR.html');
    await pageFR.goto(`file://${htmlPathFR}`, {
      waitUntil: 'networkidle0'
    });
    
    const pdfPathFR = path.join(__dirname, 'AVENIR_AI_PITCH_FR.pdf');
    await pageFR.pdf({
      path: pdfPathFR,
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    console.log('✅ French PDF saved:', pdfPathFR);
    await pageFR.close();

    console.log('🎉 Both PDFs generated successfully!');
    console.log('📦 Files created:');
    console.log('   - AVENIR_AI_PITCH_EN.pdf');
    console.log('   - AVENIR_AI_PITCH_FR.pdf');

  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePitchPDFs();

