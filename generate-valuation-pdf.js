const fs = require('fs');
const path = require('path');

// Read the markdown file
const markdownContent = fs.readFileSync(path.join(__dirname, 'UPDATED_Avenir_AI_Valuation.md'), 'utf8');

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Convert numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // Convert inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Convert line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Convert horizontal rules
  html = html.replace(/^---$/gim, '<hr>');
  
  return html;
}

// Convert markdown to HTML
const htmlContent = markdownToHtml(markdownContent);

// Create full HTML document
const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avenir AI Solutions - Updated Valuation Analysis</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            background: #fff;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            color: #1e40af;
            margin-top: 40px;
            margin-bottom: 20px;
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
        }
        
        h3 {
            color: #374151;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 40px 0;
        }
        
        strong {
            color: #1f2937;
        }
        
        .header-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .header-info p {
            margin: 5px 0;
            color: #6b7280;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            pre, ul, ol {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header-info">
        <p><strong>Document:</strong> Avenir AI Solutions - Updated Valuation Analysis</p>
        <p><strong>Date:</strong> January 2025</p>
        <p><strong>Analysis Type:</strong> Comprehensive Business & Technical Valuation</p>
        <p><strong>Status:</strong> Production-Ready AI Growth Infrastructure Platform</p>
    </div>
    
    ${htmlContent}
</body>
</html>
`;

// Write HTML file
const htmlFilePath = path.join(__dirname, 'UPDATED_Avenir_AI_Valuation.html');
fs.writeFileSync(htmlFilePath, fullHtml);

console.log('✅ HTML file generated successfully: UPDATED_Avenir_AI_Valuation.html');
console.log('');
console.log('📄 To generate PDF:');
console.log('');
console.log('Option 1 (Browser - Recommended):');
console.log('  1. Open UPDATED_Avenir_AI_Valuation.html in your browser');
console.log('  2. Press Cmd+P (Mac) or Ctrl+P (Windows)');
console.log('  3. Select "Save as PDF"');
console.log('  4. Choose "Portrait" orientation');
console.log('  5. Save as "UPDATED_Avenir_AI_Valuation.pdf"');
console.log('');
console.log('Option 2 (Chrome Headless):');
console.log('  npm install puppeteer');
console.log('  node generate-valuation-pdf-puppeteer.js');
console.log('');
console.log('Option 3 (wkhtmltopdf):');
console.log('  brew install wkhtmltopdf');
console.log('  wkhtmltopdf --orientation Portrait UPDATED_Avenir_AI_Valuation.html UPDATED_Avenir_AI_Valuation.pdf');
console.log('');
console.log('The HTML file is ready at: UPDATED_Avenir_AI_Valuation.html');
