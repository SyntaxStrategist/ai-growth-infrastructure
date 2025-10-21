#!/usr/bin/env node

/**
 * Generate PDF from Avenir AI ICP Profile Markdown
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

const MARKDOWN_FILE = 'AVENIR_AI_ICP_PROFILE.md';
const OUTPUT_PDF = 'AVENIR_AI_ICP_PROFILE.pdf';

// Custom CSS for professional PDF styling
const CSS = `
<style>
  @page {
    margin: 2cm;
    size: letter;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
    max-width: 100%;
    margin: 0;
    padding: 20px;
  }
  
  h1 {
    color: #1a1a1a;
    font-size: 28pt;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 10px;
    border-bottom: 3px solid #4F46E5;
    padding-bottom: 10px;
    page-break-after: avoid;
  }
  
  h2 {
    color: #4F46E5;
    font-size: 20pt;
    font-weight: 600;
    margin-top: 30px;
    margin-bottom: 15px;
    page-break-after: avoid;
    border-left: 4px solid #4F46E5;
    padding-left: 15px;
  }
  
  h3 {
    color: #2563EB;
    font-size: 16pt;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  
  h4 {
    color: #3B82F6;
    font-size: 13pt;
    font-weight: 600;
    margin-top: 15px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }
  
  p {
    margin: 10px 0;
    text-align: justify;
  }
  
  strong {
    color: #1a1a1a;
    font-weight: 600;
  }
  
  ul, ol {
    margin: 10px 0;
    padding-left: 25px;
  }
  
  li {
    margin: 5px 0;
  }
  
  code {
    background-color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 10pt;
    color: #e01e5a;
  }
  
  pre {
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-left: 3px solid #4F46E5;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  
  pre code {
    background: none;
    padding: 0;
    color: #333;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  
  th {
    background-color: #4F46E5;
    color: white;
    font-weight: 600;
    text-align: left;
    padding: 12px 10px;
  }
  
  td {
    border: 1px solid #ddd;
    padding: 10px;
  }
  
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  blockquote {
    border-left: 4px solid #4F46E5;
    background-color: #f8f9fa;
    margin: 15px 0;
    padding: 15px 20px;
    font-style: italic;
    page-break-inside: avoid;
  }
  
  hr {
    border: none;
    border-top: 2px solid #e5e5e5;
    margin: 30px 0;
  }
  
  /* Checkboxes */
  input[type="checkbox"] {
    margin-right: 8px;
  }
  
  /* Emojis and icons */
  .emoji {
    font-size: 14pt;
  }
  
  /* Page breaks */
  .page-break {
    page-break-after: always;
  }
  
  /* Header styling */
  .document-header {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: white;
    padding: 30px;
    margin: -20px -20px 30px -20px;
    border-radius: 0 0 10px 10px;
  }
  
  .document-header h1 {
    color: white;
    border: none;
    margin: 0;
    font-size: 32pt;
  }
  
  .document-meta {
    font-size: 10pt;
    color: rgba(255,255,255,0.9);
    margin-top: 10px;
  }
  
  /* Highlight boxes */
  .highlight-box {
    background-color: #EEF2FF;
    border-left: 4px solid #4F46E5;
    padding: 15px 20px;
    margin: 15px 0;
    border-radius: 0 5px 5px 0;
    page-break-inside: avoid;
  }
  
  /* Footer on each page */
  @page {
    @bottom-center {
      content: "Avenir AI Solutions - Ideal Client Profile | Page " counter(page);
      font-size: 9pt;
      color: #666;
    }
  }
  
  /* Print-specific */
  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
`;

async function generatePDF() {
  console.log('🚀 Starting ICP PDF Generation...\n');
  
  try {
    // Read markdown file
    console.log('📖 Reading markdown file:', MARKDOWN_FILE);
    const markdown = fs.readFileSync(MARKDOWN_FILE, 'utf-8');
    
    // Convert markdown to HTML
    console.log('🔄 Converting markdown to HTML...');
    const contentHTML = marked.parse(markdown);
    
    // Create full HTML document
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avenir AI - Ideal Client Profile</title>
  ${CSS}
</head>
<body>
  ${contentHTML}
</body>
</html>
    `;
    
    // Launch puppeteer
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    console.log('📝 Setting HTML content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('📄 Generating PDF...');
    await page.pdf({
      path: OUTPUT_PDF,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9pt; color: #666; width: 100%; text-align: center; margin-top: 10px;">
          <span>Avenir AI Solutions - Ideal Client Profile</span>
          <span style="margin: 0 10px;">|</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });
    
    await browser.close();
    
    // Get file size
    const stats = fs.statSync(OUTPUT_PDF);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n✅ PDF Generated Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Output: ${OUTPUT_PDF}`);
    console.log(`📊 Size: ${fileSizeInKB} KB`);
    console.log(`📍 Location: ${path.resolve(OUTPUT_PDF)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error generating PDF:', error);
    process.exit(1);
  }
}

// Run
generatePDF();

