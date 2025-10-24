const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateVSLPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read the HTML file
  const htmlPath = path.join(__dirname, 'Avenir_AI_VSL_OnePager.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Set the content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generate PDF - optimized for one page
  const pdf = await page.pdf({
    path: 'Avenir_AI_VSL_OnePager.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true
  });
  
  await browser.close();
  console.log('VSL One-Pager PDF generated successfully: Avenir_AI_VSL_OnePager.pdf');
}

generateVSLPDF().catch(console.error);
