import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  html_template: string;
  text_template: string;
  language: string;
  category: 'initial_outreach' | 'follow_up' | 'nurture' | 'conversion';
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface PersonalizedEmailContent {
  subject: string;
  html: string;
  text: string;
  variables_used: Record<string, any>;
}

export interface ProspectData {
  prospect_id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  industry: string;
  company_size: string;
  technology_stack: string[];
  pain_points: string[];
  score: number;
  conversion_probability: number;
  website?: string;
  location?: string;
  revenue?: string;
  employees?: number;
}

export interface TemplateContext {
  isFollowUp?: boolean;
  originalEmail?: any;
  campaignName?: string;
  customVariables?: Record<string, any>;
}

export class EmailTemplateEngine {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.loadTemplates();
  }

  /**
   * Load email templates from database
   */
  private async loadTemplates(): Promise<void> {
    try {
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*');

      if (error) throw error;

      templates?.forEach(template => {
        this.templates.set(template.id, template);
      });
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  }

  /**
   * Generate personalized email content
   */
  async generatePersonalizedEmail(
    templateId: string,
    prospect: ProspectData,
    context: TemplateContext = {}
  ): Promise<PersonalizedEmailContent> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Prepare variables for template substitution
    const variables = this.prepareTemplateVariables(prospect, context);

    // Generate content
    const subject = this.substituteVariables(template.subject_template, variables);
    const html = this.substituteVariables(template.html_template, variables);
    const text = this.substituteVariables(template.text_template, variables);

    return {
      subject,
      html,
      text,
      variables_used: variables
    };
  }

  /**
   * Prepare template variables from prospect data and context
   */
  private prepareTemplateVariables(prospect: ProspectData, context: TemplateContext): Record<string, any> {
    const variables: Record<string, any> = {
      // Basic prospect info
      company_name: prospect.company_name || 'your company',
      contact_name: prospect.contact_name || 'there',
      contact_email: prospect.contact_email,
      industry: prospect.industry || 'your industry',
      company_size: prospect.company_size || 'your company size',
      
      // Technology and pain points
      technology_stack: prospect.technology_stack?.join(', ') || 'your current tools',
      pain_points: prospect.pain_points?.join(', ') || 'your challenges',
      
      // Company details
      website: prospect.website || 'your website',
      location: prospect.location || 'your location',
      revenue: prospect.revenue || 'your revenue',
      employees: prospect.employees || 'your team size',
      
      // Scoring data
      score: Math.round(prospect.score * 100),
      conversion_probability: Math.round(prospect.conversion_probability * 100),
      
      // Context variables
      is_follow_up: context.isFollowUp || false,
      campaign_name: context.campaignName || 'our outreach',
      
      // Avenir AI specific
      avenir_services: 'AI-powered lead generation, prospect intelligence, and automated outreach',
      avenir_benefits: '3x higher conversion rates, automated prospect discovery, and intelligent lead scoring',
      
      // Custom variables
      ...context.customVariables
    };

    // Add follow-up specific variables
    if (context.isFollowUp && context.originalEmail) {
      variables.original_subject = context.originalEmail.subject;
      variables.days_since_original = this.calculateDaysSince(context.originalEmail.sent_at);
    }

    return variables;
  }

  /**
   * Substitute variables in template strings
   */
  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace {{variable}} patterns
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });

    // Replace {{variable|default}} patterns
    result = result.replace(/\{\{(\w+)\|([^}]+)\}\}/g, (match, variable, defaultValue) => {
      return variables[variable] || defaultValue;
    });

    // Replace conditional blocks {{#if variable}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    // Replace conditional blocks with else {{#if variable}}...{{else}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, ifContent, elseContent) => {
      return variables[variable] ? ifContent : elseContent;
    });

    return result;
  }

  /**
   * Calculate days since a given date
   */
  private calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Create a new email template
   */
  async createTemplate(templateData: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert([{
        name: templateData.name,
        subject_template: templateData.subject_template,
        html_template: templateData.html_template,
        text_template: templateData.text_template,
        language: templateData.language || 'en',
        category: templateData.category || 'initial_outreach',
        variables: templateData.variables || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update local cache
    this.templates.set(data.id, data);
    return data;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): EmailTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get default templates for Avenir AI
   */
  getDefaultTemplates(): Partial<EmailTemplate>[] {
    return [
      {
        name: 'Initial Outreach - AI Automation',
        subject_template: '{{company_name}} - AI Automation Opportunity',
        html_template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hi {{contact_name}},</h2>
            
            <p>I noticed {{company_name}} is in the {{industry}} space and likely dealing with {{pain_points}}.</p>
            
            <p>We've helped similar companies in your industry achieve:</p>
            <ul>
              <li>3x higher lead conversion rates</li>
              <li>Automated prospect discovery and scoring</li>
              <li>Intelligent outreach that actually gets responses</li>
            </ul>
            
            <p>Would you be interested in a 15-minute call to discuss how AI automation could help {{company_name}} generate more qualified leads?</p>
            
            <p>Best regards,<br>
            The Avenir AI Team</p>
          </div>
        `,
        text_template: `
          Hi {{contact_name}},
          
          I noticed {{company_name}} is in the {{industry}} space and likely dealing with {{pain_points}}.
          
          We've helped similar companies in your industry achieve:
          - 3x higher lead conversion rates
          - Automated prospect discovery and scoring
          - Intelligent outreach that actually gets responses
          
          Would you be interested in a 15-minute call to discuss how AI automation could help {{company_name}} generate more qualified leads?
          
          Best regards,
          The Avenir AI Team
        `,
        language: 'en',
        category: 'initial_outreach',
        variables: ['company_name', 'contact_name', 'industry', 'pain_points']
      },
      {
        name: 'Follow-up - Value Proposition',
        subject_template: 'Following up on AI automation for {{company_name}}',
        html_template: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hi {{contact_name}},</h2>
            
            <p>I wanted to follow up on my previous email about AI automation for {{company_name}}.</p>
            
            <p>Since I last reached out {{days_since_original}} days ago, I've been thinking about how our AI-powered lead generation system could specifically help {{company_name}} with {{pain_points}}.</p>
            
            <p>Here's what I think would be most valuable for your team:</p>
            <ul>
              <li>Automated prospect discovery using your ideal customer profile</li>
              <li>Intelligent lead scoring that prioritizes the best opportunities</li>
              <li>Personalized outreach that gets 3x higher response rates</li>
            </ul>
            
            <p>Would you be open to a brief 15-minute call this week to discuss how this could work for {{company_name}}?</p>
            
            <p>Best regards,<br>
            The Avenir AI Team</p>
          </div>
        `,
        text_template: `
          Hi {{contact_name}},
          
          I wanted to follow up on my previous email about AI automation for {{company_name}}.
          
          Since I last reached out {{days_since_original}} days ago, I've been thinking about how our AI-powered lead generation system could specifically help {{company_name}} with {{pain_points}}.
          
          Here's what I think would be most valuable for your team:
          - Automated prospect discovery using your ideal customer profile
          - Intelligent lead scoring that prioritizes the best opportunities
          - Personalized outreach that gets 3x higher response rates
          
          Would you be open to a brief 15-minute call this week to discuss how this could work for {{company_name}}?
          
          Best regards,
          The Avenir AI Team
        `,
        language: 'en',
        category: 'follow_up',
        variables: ['company_name', 'contact_name', 'pain_points', 'days_since_original']
      }
    ];
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      try {
        await this.createTemplate(template);
      } catch (error) {
        console.error(`Error creating default template ${template.name}:`, error);
      }
    }
  }

  /**
   * Refresh templates from database
   */
  async refreshTemplates(): Promise<void> {
    this.templates.clear();
    await this.loadTemplates();
  }
}
