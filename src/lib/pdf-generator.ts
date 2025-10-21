import { createWriteStream } from 'fs';
import { join } from 'path';

interface DailyReportData {
  date: string;
  generatedAt: string;
  summary: {
    totalEmails: number;
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    openRate: number;
    replyRate: number;
  };
  actionCounts: Record<string, number>;
  emails: Array<{
    id: string;
    prospectEmail: string;
    prospectName?: string;
    companyName?: string;
    subject?: string;
    status: string;
    sentAt?: string;
    openedAt?: string;
    repliedAt?: string;
    createdAt: string;
    prospect?: {
      business_name: string;
      industry?: string;
      language: string;
      automation_need_score: number;
    };
  }>;
}

export function generateHTMLReport(data: DailyReportData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#3b82f6';
      case 'delivered': return '#10b981';
      case 'opened': return '#8b5cf6';
      case 'replied': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Outreach Report - ${formatDate(data.date)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 2.5rem;
        }
        .header .subtitle {
            color: #6b7280;
            margin: 10px 0 0 0;
            font-size: 1.1rem;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #1e40af;
            margin: 0;
        }
        .summary-card .percentage {
            font-size: 1.5rem;
            font-weight: bold;
            color: #059669;
            margin: 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .metrics-table th,
        .metrics-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .metrics-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            color: white;
        }
        .emails-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        .emails-table th,
        .emails-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .emails-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        .emails-table tr:nth-child(even) {
            background: #f8fafc;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #6b7280;
            font-size: 0.9rem;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .header h1 { font-size: 2rem; }
            .summary-grid { grid-template-columns: repeat(4, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Outreach Report</h1>
        <p class="subtitle">${formatDate(data.date)}</p>
        <p class="subtitle">Generated: ${formatDateTime(data.generatedAt)}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Emails</h3>
            <p class="value">${data.summary.totalEmails}</p>
        </div>
        <div class="summary-card">
            <h3>Emails Sent</h3>
            <p class="value">${data.summary.totalSent}</p>
        </div>
        <div class="summary-card">
            <h3>Open Rate</h3>
            <p class="percentage">${data.summary.openRate.toFixed(1)}%</p>
        </div>
        <div class="summary-card">
            <h3>Reply Rate</h3>
            <p class="percentage">${data.summary.replyRate.toFixed(1)}%</p>
        </div>
        <div class="summary-card">
            <h3>Approved</h3>
            <p class="value">${data.summary.totalApproved}</p>
        </div>
        <div class="summary-card">
            <h3>Rejected</h3>
            <p class="value">${data.summary.totalRejected}</p>
        </div>
        <div class="summary-card">
            <h3>Pending</h3>
            <p class="value">${data.summary.totalPending}</p>
        </div>
        <div class="summary-card">
            <h3>Replies</h3>
            <p class="value">${data.summary.totalReplied}</p>
        </div>
    </div>

    <div class="section">
        <h2>Activity Summary</h2>
        <table class="metrics-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Emails Sent</td>
                    <td>${data.summary.totalSent}</td>
                    <td>${data.summary.totalEmails > 0 ? ((data.summary.totalSent / data.summary.totalEmails) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                    <td>Emails Opened</td>
                    <td>${data.summary.totalOpened}</td>
                    <td>${data.summary.totalSent > 0 ? ((data.summary.totalOpened / data.summary.totalSent) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                    <td>Replies Received</td>
                    <td>${data.summary.totalReplied}</td>
                    <td>${data.summary.totalSent > 0 ? ((data.summary.totalReplied / data.summary.totalSent) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                    <td>Approved for Sending</td>
                    <td>${data.summary.totalApproved}</td>
                    <td>${data.summary.totalEmails > 0 ? ((data.summary.totalApproved / data.summary.totalEmails) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                    <td>Rejected</td>
                    <td>${data.summary.totalRejected}</td>
                    <td>${data.summary.totalEmails > 0 ? ((data.summary.totalRejected / data.summary.totalEmails) * 100).toFixed(1) : 0}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    ${Object.keys(data.actionCounts).length > 0 ? `
    <div class="section">
        <h2>Action Breakdown</h2>
        <table class="metrics-table">
            <thead>
                <tr>
                    <th>Action</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.actionCounts).map(([action, count]) => `
                <tr>
                    <td>${action.charAt(0).toUpperCase() + action.slice(1)}</td>
                    <td>${count}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>Email Details</h2>
        <table class="emails-table">
            <thead>
                <tr>
                    <th>Prospect</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Sent</th>
                    <th>Opened</th>
                    <th>Replied</th>
                </tr>
            </thead>
            <tbody>
                ${data.emails.map(email => `
                <tr>
                    <td>${email.prospectName || email.prospectEmail}</td>
                    <td>${email.companyName || email.prospect?.business_name || 'N/A'}</td>
                    <td>
                        <span class="status-badge" style="background-color: ${getStatusColor(email.status)}">
                            ${email.status}
                        </span>
                    </td>
                    <td>${formatDateTime(email.createdAt)}</td>
                    <td>${email.sentAt ? formatDateTime(email.sentAt) : '-'}</td>
                    <td>${email.openedAt ? formatDateTime(email.openedAt) : '-'}</td>
                    <td>${email.repliedAt ? formatDateTime(email.repliedAt) : '-'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Generated by Avenir AI Solutions Outreach System</p>
        <p>This report contains confidential information and should be handled appropriately.</p>
    </div>
</body>
</html>
  `;
}

export async function saveHTMLReport(data: DailyReportData, filename: string): Promise<string> {
  const html = generateHTMLReport(data);
  const filepath = join(process.cwd(), 'reports', filename);
  
  const fs = require('fs');
  fs.writeFileSync(filepath, html);
  
  return filepath;
}
