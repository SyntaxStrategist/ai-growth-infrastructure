const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateVSLPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read the HTML file
  const htmlPath = path.join(__dirname, 'Avenir_AI_VSL_OnePager_Landscape.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Set the content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generate PDF - landscape format for one Mac M4 screen
  const pdf = await page.pdf({
    path: 'Avenir_AI_VSL_OnePager_Landscape.pdf',
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '5mm',
      right: '5mm',
      bottom: '5mm',
      left: '5mm'
    },
    displayHeaderFooter: false,
    preferCSSPageSize: true
  });
  
  await browser.close();
  console.log('VSL Landscape One-Pager PDF generated successfully: Avenir_AI_VSL_OnePager_Landscape.pdf');
}

generateVSLPDF().catch(console.error);
