const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Read logo
const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logos', 'logo-512x512.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const HTML_EN = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Avenir AI - Client Dashboard Guide</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1e293b;
            background: white;
        }
        
        /* Cover Page */
        .cover {
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            page-break-after: always;
            padding: 60px;
        }
        
        .cover-logo {
            width: 180px;
            height: 180px;
            margin-bottom: 40px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .cover h1 {
            font-size: 64px;
            font-weight: 800;
            margin-bottom: 20px;
            color: #ffffff !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: #ffffff !important;
            background-clip: unset !important;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .cover .subtitle {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 40px;
            color: #ffffff;
        }
        
        .cover .tagline {
            font-size: 20px;
            max-width: 600px;
            line-height: 1.6;
            color: #ffffff;
        }
        
        .cover .version {
            margin-top: 60px;
            font-size: 16px;
            color: #ffffff;
            opacity: 0.9;
        }
        
        /* Section Divider */
        .section-divider {
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-before: always;
            page-break-after: always;
        }
        
        .section-divider-content {
            text-align: center;
            color: white;
            padding: 60px;
        }
        
        .section-divider h2 {
            font-size: 56px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #ffffff !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: #ffffff !important;
            background-clip: unset !important;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        
        .section-divider p {
            font-size: 24px;
            color: #ffffff !important;
        }
        
        /* Content Pages */
        .content-page {
            min-height: 100vh;
            padding: 40px;
            background: white;
        }
        
        /* Header with Logo */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 50px;
            padding-bottom: 20px;
            border-bottom: 3px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #667eea, #764ba2) border-box;
        }
        
        .header-logo {
            width: 50px;
            height: 50px;
        }
        
        .header-title {
            font-size: 18px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        h1 {
            font-size: 42px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 50px 0 30px;
        }
        
        h2 {
            font-size: 32px;
            color: #764ba2;
            margin: 40px 0 20px;
            font-weight: 600;
        }
        
        h3 {
            font-size: 24px;
            color: #475569;
            margin: 30px 0 15px;
            font-weight: 600;
        }
        
        p {
            margin-bottom: 18px;
            color: #475569;
            font-size: 16px;
        }
        
        ul, ol {
            margin-left: 30px;
            margin-bottom: 25px;
        }
        
        li {
            margin-bottom: 12px;
            color: #475569;
            line-height: 1.8;
        }
        
        /* Fancy Cards */
        .fancy-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
            border-left: 5px solid transparent;
            background-clip: padding-box;
            position: relative;
        }
        
        .fancy-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 5px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 16px 0 0 16px;
        }
        
        .fancy-card-title {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 30px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        th {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 18px;
            text-align: left;
            font-weight: 600;
            font-size: 16px;
        }
        
        td {
            padding: 18px;
            border-bottom: 1px solid #e2e8f0;
            background: white;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:hover td {
            background: #f8fafc;
        }
        
        /* Code */
        code {
            background: #1e293b;
            color: #10b981;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 14px;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 25px;
            border-radius: 12px;
            overflow-x: auto;
            margin: 25px 0;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        pre code {
            background: transparent;
            color: inherit;
            padding: 0;
        }
        
        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        .badge-blue {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            color: #1e40af;
        }
        
        .badge-purple {
            background: linear-gradient(135deg, #ede9fe, #ddd6fe);
            color: #6b21a8;
        }
        
        .badge-green {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            color: #065f46;
        }
        
        /* TOC */
        .toc {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px;
            border-radius: 16px;
            margin: 40px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
        }
        
        .toc-title {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 25px;
        }
        
        .toc ul {
            list-style: none;
            margin: 0;
        }
        
        .toc li {
            margin-bottom: 15px;
            font-size: 18px;
            padding-left: 30px;
            position: relative;
        }
        
        .toc li::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            margin-top: 80px;
            padding: 40px 0;
            text-align: center;
            border-top: 3px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #667eea, #764ba2) border-box;
        }
        
        .footer p {
            color: #64748b;
            font-size: 14px;
        }
        
        /* Emoji */
        .emoji {
            font-size: 1.3em;
            margin-right: 12px;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="cover">
        <img src="data:image/png;base64,${logoBase64}" class="cover-logo" alt="Avenir AI Logo" />
        <h1>Avenir AI</h1>
        <div class="subtitle">Client Dashboard Guide</div>
        <p class="tagline">
            Master your real-time AI-powered lead intelligence system
        </p>
        <div class="version">
            Version 2.0 • November 2024
        </div>
    </div>
    
    <!-- SECTION DIVIDER: Getting Started -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>🚀 Getting Started</h2>
            <p>Your journey to smarter lead management begins here</p>
        </div>
    </div>
    
    <!-- CONTENT: Getting Started -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • CLIENT GUIDE</div>
        </div>
        
        <h1><span class="emoji">🔐</span>Logging In</h1>
        
        <ol>
            <li>Navigate to: <code>https://www.aveniraisolutions.ca/{locale}/client/login</code></li>
            <li>Enter your registered email address</li>
            <li>Enter your secure password</li>
            <li>Click <strong>"Login"</strong> / <strong>"Connexion"</strong></li>
        </ol>
        
        <div class="fancy-card">
            <div class="fancy-card-title">💡 Quick Tip: Language Toggle</div>
            <p>Switch between English and French instantly using the language selector in the top-right corner of your dashboard. Your preference is saved automatically.</p>
        </div>
        
        <h2>First-Time Setup</h2>
        
        <p>After your first login, you'll be guided through a quick 3-step setup:</p>
        
        <ul>
            <li><strong>Step 1:</strong> Verify your business information</li>
            <li><strong>Step 2:</strong> Configure your lead preferences</li>
            <li><strong>Step 3:</strong> Get your API key for website integration</li>
        </ul>
    </div>
    
    <!-- SECTION DIVIDER: Dashboard Overview -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📊 Dashboard Overview</h2>
            <p>Navigate your command center with confidence</p>
        </div>
    </div>
    
    <!-- CONTENT: Dashboard Overview -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • CLIENT GUIDE</div>
        </div>
        
        <h1><span class="emoji">📊</span>Your Dashboard</h1>
        
        <h2>Navigation Menu</h2>
        
        <div class="fancy-card">
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <span class="badge badge-blue">📊 Analytics</span>
                <span class="badge badge-purple">🧠 AI Training</span>
                <span class="badge badge-green">⚙️ Settings</span>
                <span class="badge badge-blue">🔑 API Access</span>
            </div>
        </div>
        
        <h3>1. Lead Table (Center View)</h3>
        <ul>
            <li>Real-time display of all your leads</li>
            <li>AI analysis completed within 5-15 seconds</li>
            <li>Filter options: All / Active / Converted / Archived</li>
            <li>Sort by: Date, Urgency, Confidence, Status</li>
        </ul>
        
        <h3>2. Key Metrics Dashboard</h3>
        <ul>
            <li><strong>Total Leads:</strong> Cumulative count of all submissions</li>
            <li><strong>High Priority:</strong> Leads requiring immediate attention</li>
            <li><strong>Avg Confidence:</strong> AI's certainty level (0-100%)</li>
            <li><strong>Conversion Rate:</strong> Percentage of leads converted to clients</li>
        </ul>
    </div>
    
    <!-- SECTION DIVIDER: Lead Management -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📧 Lead Management</h2>
            <p>Every lead, analyzed and actionable</p>
        </div>
    </div>
    
    <!-- CONTENT: Lead Information -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • CLIENT GUIDE</div>
        </div>
        
        <h1><span class="emoji">📧</span>Understanding Your Leads</h1>
        
        <h2>Lead Information Table</h2>
        
        <table>
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Name</strong></td>
                    <td>Lead's full name as submitted</td>
                </tr>
                <tr>
                    <td><strong>Email</strong></td>
                    <td>Primary contact email address</td>
                </tr>
                <tr>
                    <td><strong>Language</strong></td>
                    <td>EN (English) or FR (French) - auto-detected</td>
                </tr>
                <tr>
                    <td><strong>Message</strong></td>
                    <td>Original message submitted by the lead</td>
                </tr>
                <tr>
                    <td><strong>AI Summary</strong></td>
                    <td>Concise overview of the lead's intent and needs</td>
                </tr>
                <tr>
                    <td><strong>Intent</strong></td>
                    <td>Categorized reason for contact (Service Request, Partnership, etc.)</td>
                </tr>
                <tr>
                    <td><strong>Tone</strong></td>
                    <td>Communication style (Professional, Casual, Urgent, Direct, etc.)</td>
                </tr>
                <tr>
                    <td><strong>Urgency</strong></td>
                    <td>Priority level: High / Medium / Low</td>
                </tr>
                <tr>
                    <td><strong>Confidence</strong></td>
                    <td>AI's certainty in its analysis (0-100%)</td>
                </tr>
                <tr>
                    <td><strong>Timestamp</strong></td>
                    <td>Date and time of lead submission</td>
                </tr>
            </tbody>
        </table>
        
        <h2>Available Actions</h2>
        
        <div class="fancy-card">
            <div class="fancy-card-title">Quick Actions for Every Lead</div>
            <ul style="margin: 0;">
                <li>📞 <strong>Mark as Contacted</strong> - Track your follow-up progress</li>
                <li>📅 <strong>Meeting Booked</strong> - Log scheduled appointments</li>
                <li>💰 <strong>Client Closed</strong> - Mark successful conversions</li>
                <li>❌ <strong>No Sale</strong> - Document leads that didn't convert</li>
                <li>🏷️ <strong>Tag Lead</strong> - Add custom categorization tags</li>
                <li>📦 <strong>Archive Lead</strong> - Remove from active view (recoverable)</li>
                <li>🗑️ <strong>Delete Lead</strong> - Permanently remove (irreversible)</li>
            </ul>
        </div>
    </div>
    
    <!-- SECTION DIVIDER: Analytics -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📈 Analytics & Insights</h2>
            <p>Data-driven decisions at your fingertips</p>
        </div>
    </div>
    
    <!-- CONTENT: Analytics -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • CLIENT GUIDE</div>
        </div>
        
        <h1><span class="emoji">📈</span>Analytics Dashboard</h1>
        
        <p><strong>Access:</strong> Click <span class="badge badge-blue">📊 Analytics</span> in the top navigation menu</p>
        
        <h2>Available Metrics</h2>
        
        <h3>1. Total Leads</h3>
        <p>Complete count of all leads received since account activation. This metric tracks your overall lead generation performance.</p>
        
        <h3>2. Average Confidence</h3>
        <p>The AI's average certainty score across all analyzed leads. Higher scores indicate more definitive analysis patterns.</p>
        
        <h3>3. Intent Distribution</h3>
        <p>Visual breakdown of lead types:</p>
        <ul>
            <li><strong>Service Request:</strong> Leads seeking your primary offerings</li>
            <li><strong>B2B Partnership:</strong> Business collaboration opportunities</li>
            <li><strong>Consultation:</strong> Advisory or consultation requests</li>
            <li><strong>Support Inquiry:</strong> Technical or customer support needs</li>
            <li><strong>Information Request:</strong> General information seekers</li>
        </ul>
        
        <h3>4. Urgency Breakdown</h3>
        <div class="fancy-card">
            <ul style="margin: 0;">
                <li><strong>🔴 High:</strong> Requires immediate action (within 24 hours)</li>
                <li><strong>🟡 Medium:</strong> Follow up within 24-48 hours</li>
                <li><strong>🟢 Low:</strong> General inquiries (48+ hours acceptable)</li>
            </ul>
        </div>
        
        <h3>5. Tone Analysis</h3>
        <p>Understanding communication styles helps prioritize and personalize your responses:</p>
        <ul>
            <li><strong>Professional:</strong> Formal business communication</li>
            <li><strong>Casual:</strong> Friendly, informal approach</li>
            <li><strong>Urgent:</strong> Time-sensitive language patterns</li>
            <li><strong>Curious:</strong> Exploratory, information-gathering tone</li>
            <li><strong>Direct:</strong> Straight-to-the-point communication</li>
        </ul>
        
        <h3>6. Language Distribution</h3>
        <p>Percentage breakdown of English vs French leads, helping you understand your market demographics.</p>
        
        <div class="footer">
            <p><strong>© 2024 Avenir AI Solutions • All Rights Reserved</strong></p>
            <p>contact@aveniraisolutions.ca</p>
        </div>
    </div>
    
    <!-- Additional sections would follow the same pattern -->
</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Generating professional PDF with logo and transitions...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(HTML_EN, { waitUntil: 'networkidle0' });
  
  const outputPath = path.join(__dirname, '..', 'public', 'client-guides', 'AVENIR_CLIENT_GUIDE_EN_2024.pdf');
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    preferCSSPageSize: true
  });
  
  console.log('✅ Professional PDF generated!');
  await browser.close();
}

generatePDF().catch(console.error);

