const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the HTML file
  const htmlPath = path.resolve(__dirname, 'AVENIR_AI_BUSINESS_PLAN.html');
  await page.goto(`file://${htmlPath}`, { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });
  
  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate PDF with proper formatting
  const pdf = await page.pdf({
    path: 'AVENIR_AI_BUSINESS_PLAN.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Avenir AI Solutions - Business Plan 2025</div>',
    footerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  
  console.log('✅ Business Plan PDF generated successfully: AVENIR_AI_BUSINESS_PLAN.pdf');
}

generatePDF().catch(console.error);
