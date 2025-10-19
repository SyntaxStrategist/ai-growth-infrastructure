'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  total_emails: number;
  open_rate: number;
  reply_rate: number;
  conversion_rate: number;
  created_at: string;
}

interface Email {
  id: string;
  prospect_name: string;
  company_name: string;
  subject: string;
  status: string;
  sent_at: string;
  opened_at?: string;
  replied_at?: string;
}

interface Metrics {
  total_campaigns: number;
  active_campaigns: number;
  total_emails_sent: number;
  total_emails_opened: number;
  total_emails_replied: number;
  total_conversions: number;
  average_open_rate: number;
  average_reply_rate: number;
  average_conversion_rate: number;
}

interface OutreachCenterProps {
  locale?: string;
}

export default function OutreachCenter({ locale = 'en' }: OutreachCenterProps) {
  const t = useTranslations('outreach');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadOutreachData();
  }, []);

  const loadOutreachData = async () => {
    try {
      setLoading(true);
      
      // Load campaigns
      const campaignsResponse = await fetch('/api/outreach?action=campaigns');
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData.data || []);

      // Load metrics
      const metricsResponse = await fetch('/api/outreach?action=metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData.data || null);

    } catch (error) {
      console.error('Error loading outreach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'replied': return 'bg-orange-100 text-orange-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'bounced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          📧 {t('newCampaign')}
        </button>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('metrics.emailsSent')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.total_emails_sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('metrics.openRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.average_open_rate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('metrics.replyRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.average_reply_rate)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('metrics.conversionRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.average_conversion_rate)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            {t('tabs.overview')}
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'campaigns' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('campaigns')}
          >
            {t('tabs.campaigns')}
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'emails' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('emails')}
          >
            {t('tabs.emails')}
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('analytics')}
          >
            {t('tabs.analytics')}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Campaigns */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    📅 {t('sections.recentCampaigns')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">
                            {campaign.total_emails} emails • {formatPercentage(campaign.open_rate)} open rate
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center">
                    📊 {t('sections.performanceInsights')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('insights.bestPerformingDay')}</span>
                      <span className="font-medium">Tuesday</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('insights.bestPerformingTime')}</span>
                      <span className="font-medium">10:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('insights.topTemplate')}</span>
                      <span className="font-medium">{t('templates.aiAutomation')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('insights.avgResponseTime')}</span>
                      <span className="font-medium">2.3 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">{t('sections.allCampaigns')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <p className="text-sm text-gray-600">Created {formatDate(campaign.created_at)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{campaign.total_emails}</p>
                          <p className="text-sm text-gray-600">Emails</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{formatPercentage(campaign.open_rate)}</p>
                          <p className="text-sm text-gray-600">Open Rate</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{formatPercentage(campaign.reply_rate)}</p>
                          <p className="text-sm text-gray-600">Reply Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">{t('sections.recentEmails')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {emails.slice(0, 10).map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{email.prospect_name}</h4>
                          <span className="text-sm text-gray-500">at {email.company_name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{email.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent {formatDate(email.sent_at)}
                          {email.opened_at && ` • Opened ${formatDate(email.opened_at)}`}
                          {email.replied_at && ` • Replied ${formatDate(email.replied_at)}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmailStatusColor(email.status)}`}>
                        {email.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">{t('sections.conversionFunnel')}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('funnel.emailsSent')}</span>
                      <span className="font-medium">1,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('funnel.emailsDelivered')}</span>
                      <span className="font-medium">950 (95%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('funnel.emailsOpened')}</span>
                      <span className="font-medium">285 (30%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('funnel.emailsReplied')}</span>
                      <span className="font-medium">57 (6%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('funnel.conversions')}</span>
                      <span className="font-medium">12 (1.2%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">{t('sections.templatePerformance')}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('templates.aiAutomation')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">32% open</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm font-medium">8% reply</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('templates.followUpValue')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">28% open</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm font-medium">6% reply</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('templates.nurtureSequence')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">25% open</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm font-medium">5% reply</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}