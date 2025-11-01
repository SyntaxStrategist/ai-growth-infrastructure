const puppeteer = require('puppeteer');
const path = require('path');

async function generateValuePropositionPDFs() {
  console.log('🎯 Generating Value Proposition PDFs...\n');

  const files = [
    {
      html: 'AVENIR_AI_VALUE_PROPOSITION_EN.html',
      pdf: 'AVENIR_AI_VALUE_PROPOSITION_EN.pdf',
      lang: 'English'
    },
    {
      html: 'AVENIR_AI_VALUE_PROPOSITION_FR.html',
      pdf: 'AVENIR_AI_VALUE_PROPOSITION_FR.pdf',
      lang: 'French'
    }
  ];

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const file of files) {
      console.log(`📄 Processing ${file.lang} version...`);
      
      const htmlPath = path.join(__dirname, file.html);
      const pdfPath = path.join(__dirname, file.pdf);
      
      const page = await browser.newPage();
      
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px'
        }
      });

      console.log(`✅ ${file.lang} PDF generated: ${file.pdf}`);
    }

    await browser.close();

    console.log('\n🎉 All Value Proposition PDFs generated successfully!\n');
    console.log('📁 Files created:');
    console.log('   - AVENIR_AI_VALUE_PROPOSITION_EN.pdf (English)');
    console.log('   - AVENIR_AI_VALUE_PROPOSITION_FR.pdf (French)\n');

  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  }
}

generateValuePropositionPDFs();

