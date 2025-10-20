#!/usr/bin/env node

/**
 * Generate PDF Report for Avenir AI Analysis
 * Converts the HTML report to a professional PDF
 */

const fs = require('fs');
const path = require('path');

// Check if puppeteer is available
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.log('Puppeteer not found. Installing...');
  console.log('Please run: npm install puppeteer');
  process.exit(1);
}

async function generatePDF() {
  console.log('🎯 Generating Avenir AI Report PDF...');
  
  try {
    // Read the HTML file
    const htmlPath = path.join(__dirname, 'Avenir_AI_Company_System_Value_Report.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Load HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdfPath = path.join(__dirname, 'Avenir_AI_Company_System_Value_Report.pdf');
    
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
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Avenir AI — Company Analysis</div>',
      footerTemplate: '<div style="font-size: 10px; color: #666; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    await browser.close();
    
    // Get file size
    const stats = fs.statSync(pdfPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    console.log('✅ PDF generated successfully!');
    console.log(`📄 File: Avenir_AI_Company_System_Value_Report.pdf`);
    console.log(`📊 Size: ${fileSizeKB} KB`);
    console.log(`📁 Location: ${pdfPath}`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generatePDF();
}

module.exports = { generatePDF };
