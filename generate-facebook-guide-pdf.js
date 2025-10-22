const puppeteer = require('puppeteer');
const fs = require('fs');

async function generatePDF() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Read the markdown content
  const markdownContent = fs.readFileSync('FACEBOOK_CLIENT_ACQUISITION_GUIDE.md', 'utf8');
  
  // Convert markdown to beautiful HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facebook Client Acquisition Gameplan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.7;
      color: #2d3748;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      border-radius: 20px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    h1 {
      color: #2d3748;
      font-size: 2.2rem;
      font-weight: 700;
      margin: 40px 0 20px 0;
      padding-bottom: 15px;
      border-bottom: 3px solid #667eea;
    }
    
    h2 {
      color: #4a5568;
      font-size: 1.6rem;
      font-weight: 600;
      margin: 35px 0 15px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    h3 {
      color: #718096;
      font-size: 1.3rem;
      font-weight: 500;
      margin: 25px 0 10px 0;
    }
    
    .phase-box {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-left: 5px solid #667eea;
      padding: 25px;
      margin: 20px 0;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    
    .step-box {
      background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
      border-left: 5px solid #38b2ac;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
    }
    
    .tip-box {
      background: linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%);
      border-left: 5px solid #ed8936;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
    }
    
    .success-box {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
      font-weight: 500;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    
    .checklist-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin: 25px 0;
    }
    
    .checklist-box h3 {
      color: white;
      margin-bottom: 15px;
    }
    
    .checklist-box ul {
      list-style: none;
      padding: 0;
    }
    
    .checklist-box li {
      margin: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    
    .checklist-box li:before {
      content: "☐";
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    code {
      background: #2d3748;
      color: #68d391;
      padding: 4px 8px;
      border-radius: 6px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 25px;
      border-radius: 12px;
      overflow-x: auto;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border: 1px solid #4a5568;
    }
    
    pre code {
      background: none;
      color: #e2e8f0;
      padding: 0;
    }
    
    .url-box {
      background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 15px 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 1.1rem;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    strong {
      color: #2d3748;
      font-weight: 600;
    }
    
    ul, ol {
      padding-left: 25px;
      margin: 15px 0;
    }
    
    li {
      margin: 8px 0;
      line-height: 1.6;
    }
    
    .emoji {
      font-size: 1.3em;
      margin-right: 8px;
    }
    
    .footer {
      background: #f7fafc;
      padding: 30px 40px;
      text-align: center;
      color: #718096;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer strong {
      color: #4a5568;
    }
    
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      margin: 40px 0;
      border-radius: 1px;
    }
    
    .quick-ref {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      margin: 30px 0;
    }
    
    .quick-ref h3 {
      color: white;
      margin-bottom: 20px;
    }
    
    .quick-ref code {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    
    .sample-post {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Facebook Client Acquisition Gameplan</h1>
      <p>Complete Facebook outreach strategy for Avenir AI Solutions</p>
    </div>
    
    <div class="content">
      ${markdownContent
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/```bash\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
        .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
        .replace(/✅ \*\*(.*?)\*\*/g, '<div class="success-box">✅ <strong>$1</strong></div>')
        .replace(/^\- \[ \] (.*$)/gm, '<li style="list-style: none; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0;">☐</span>$1</li>')
        .replace(/^\- \[x\] (.*$)/gm, '<li style="list-style: none; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0;">☑</span>$1</li>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*$)/gm, '<li><strong>$1.</strong> $2</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|l]|<\/|<div|<\/div)/gm, '<p>')
        .replace(/<\/p><p><\/p>/g, '')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>')
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><div/g, '<div')
        .replace(/<\/div><\/p>/g, '</div>')
      }
    </div>
    
    <div class="footer">
      <strong>Created by Avenir AI Solutions</strong><br>
      Last Updated: October 22, 2025
    </div>
  </div>
</body>
</html>
`;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: 'FACEBOOK_CLIENT_ACQUISITION_GUIDE.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  await browser.close();
  console.log('✅ Facebook Client Acquisition Guide PDF generated!');
}

generatePDF().catch(console.error);
