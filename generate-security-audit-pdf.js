const puppeteer = require('puppeteer');
const path = require('path');

async function generateSecurityAuditPDF() {
  console.log('🔐 Generating Security Audit Report PDF...\n');

  const htmlPath = path.join(__dirname, 'SECURITY_AUDIT_REPORT_2025.html');
  const pdfPath = path.join(__dirname, 'SECURITY_AUDIT_REPORT_2025.pdf');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    console.log('📄 Loading HTML file...');
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('🎨 Rendering PDF...');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: true
    });

    await browser.close();

    console.log('\n✅ PDF generated successfully!');
    console.log(`📁 Saved to: ${pdfPath}\n`);
    console.log('🎉 Your beautiful security audit report is ready!\n');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

generateSecurityAuditPDF();

