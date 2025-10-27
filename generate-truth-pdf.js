#!/usr/bin/env node

const fs = require('fs');
const puppeteer = require('puppeteer');

const MARKDOWN_FILE = 'TheTruth.md';
const OUTPUT_PDF = 'TheTruth.pdf';

const CSS = `
<style>
  @page {
    margin: 1.5cm;
    size: letter;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #2d3748;
    background: #ffffff;
  }
  
  .header {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: white;
    padding: 30px 40px;
    margin: -40px -40px 40px -40px;
    border-radius: 8px;
  }
  
  .header h1 {
    font-size: 32pt;
    font-weight: 700;
    margin-bottom: 8px;
    border-bottom: none;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  }
  
  .header p {
    font-size: 13pt;
    opacity: 0.95;
    margin: 5px 0;
  }
  
  .subtitle {
    font-size: 14pt;
    font-weight: 300;
    opacity: 0.9;
    margin-top: 10px;
  }
  
  h1 {
    color: #4F46E5;
    font-size: 26pt;
    font-weight: 700;
    margin-top: 40px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 3px solid #4F46E5;
    page-break-after: avoid;
  }
  
  h2 {
    color: #6366F1;
    font-size: 18pt;
    font-weight: 600;
    margin-top: 30px;
    margin-bottom: 15px;
    padding-left: 8px;
    border-left: 4px solid #6366F1;
    page-break-after: avoid;
  }
  
  h3 {
    color: #818CF8;
    font-size: 14pt;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 12px;
  }
  
  p {
    margin: 12px 0;
    text-align: justify;
  }
  
  strong {
    color: #1a1a1a;
    font-weight: 700;
  }
  
  ul, ol {
    margin: 18px 0;
    padding-left: 30px;
  }
  
  li {
    margin: 10px 0;
    line-height: 1.6;
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 25px 0;
    font-size: 10pt;
    page-break-inside: avoid;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  th {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: white;
    font-weight: 600;
    padding: 14px 12px;
    text-align: left;
    font-size: 10.5pt;
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:nth-child(even) {
    background-color: #f9fafb;
  }
  
  tr:hover {
    background-color: #f3f4f6;
  }
  
  .highlight {
    background: linear-gradient(120deg, #dbeafe 0%, #e0e7ff 100%);
    padding: 15px 20px;
    border-left: 5px solid #4F46E5;
    border-radius: 6px;
    margin: 20px 0;
  }
  
  .highlight p {
    margin: 0;
    font-weight: 500;
  }
  
  .metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 25px 0;
  }
  
  .metric-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
  }
  
  .metric-value {
    font-size: 28pt;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .metric-label {
    font-size: 11pt;
    opacity: 0.95;
  }
  
  code {
    background-color: #f3f4f6;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Courier New', 'Monaco', monospace;
    font-size: 9.5pt;
    color: #dc2626;
  }
  
  .check {
    color: #10b981;
    font-weight: bold;
  }
  
  .x {
    color: #ef4444;
    font-weight: bold;
  }
  
  .warning {
    color: #f59e0b;
    font-weight: bold;
  }
  
  .section {
    background: #fafafa;
    padding: 20px;
    border-radius: 8px;
    margin: 25px 0;
    border: 1px solid #e5e7eb;
  }
  
  .tagline {
    font-style: italic;
    color: #6b7280;
    margin: 20px 0;
    padding: 15px;
    background: #fef3c7;
    border-left: 5px solid #f59e0b;
    border-radius: 6px;
  }
  
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 9pt;
    font-style: italic;
  }
  
  hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 30px 0;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
`;

function convertMarkdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Special formatting
  html = html.replace(/✅/g, '<span class="check">✓</span>');
  html = html.replace(/❌/g, '<span class="x">✗</span>');
  html = html.replace(/⚠️/g, '<span class="warning">⚠</span>');
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // Paragraphs
  const lines = html.split('\n');
  let result = [];
  let currentParagraph = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (currentParagraph.length > 0) {
        result.push('<p>' + currentParagraph.join(' ') + '</p>');
        currentParagraph = [];
      }
      continue;
    }
    
    if (line.match(/^<[h|u|o|t]/)) {
      if (currentParagraph.length > 0) {
        result.push('<p>' + currentParagraph.join(' ') + '</p>');
        currentParagraph = [];
      }
      result.push(line);
    } else {
      currentParagraph.push(line);
    }
  }
  
  if (currentParagraph.length > 0) {
    result.push('<p>' + currentParagraph.join(' ') + '</p>');
  }
  
  return result.join('\n');
}

async function generatePDF() {
  try {
    console.log('📄 Reading markdown file...');
    const markdown = fs.readFileSync(MARKDOWN_FILE, 'utf-8');
    
    console.log('🔄 Converting to HTML...');
    const htmlContent = convertMarkdownToHTML(markdown);
    
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Avenir AI Solutions - Technical Valuation</title>
  ${CSS}
</head>
<body>
  <div class="header">
    <h1>AVENIR AI SOLUTIONS</h1>
    <p class="subtitle">Technical & Market Valuation Assessment</p>
    <p style="font-size: 11pt; margin-top: 15px; opacity: 0.85;">Enterprise-Ready AI-Powered B2B SaaS Platform</p>
  </div>
  
  ${htmlContent}
  
  <div class="footer">
    <p>Assessment completed January 2025 • Technical Evaluation: Production-Ready B2B SaaS • Market Position: Early Stage with Strong Fundamentals</p>
  </div>
</body>
</html>
`;
    
    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
    
    console.log('📄 Generating PDF...');
    await page.pdf({
      path: OUTPUT_PDF,
      format: 'Letter',
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    const stats = fs.statSync(OUTPUT_PDF);
    console.log('✅ PDF generated successfully!');
    console.log(`📊 File: ${OUTPUT_PDF}`);
    console.log(`📦 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

generatePDF();
