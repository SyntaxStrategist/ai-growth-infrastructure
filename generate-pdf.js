const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read the HTML file
  const htmlPath = path.join(__dirname, 'Avenir_AI_Oct22_Valuation.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Set the content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generate PDF
  const pdf = await page.pdf({
    path: 'Avenir_AI_Oct22_Valuation.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Avenir AI Solutions - October 2025 Valuation</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  console.log('PDF generated successfully: Avenir_AI_Oct22_Valuation.pdf');
}

generatePDF().catch(console.error);