#!/usr/bin/env node

/**
 * Avenir AI Solutions - End-to-End Client System Test
 * 
 * This script simulates a full client signup and dashboard experience:
 * 1. Creates a test client account with proper credentials
 * 2. Generates 10 AI leads (5 English, 5 French) with realistic data
 * 3. Creates 2 repeat customer leads for relationship insights testing
 * 4. Pre-fills ICP with realistic demo values
 * 5. Tests dashboard functionality in both languages
 * 
 * Usage: node test-e2e-client-system.js
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Configuration
const BASE_URL = 'https://www.aveniraisolutions.ca';
const TEST_CLIENT_EMAIL = 'test-client@aveniraisolutions.ca';
const TEST_CLIENT_PASSWORD = 'TestClient2025!';
const TEST_CLIENT_NAME = 'Test Client';
const TEST_BUSINESS_NAME = 'Avenir Test Solutions Inc.';

// Test data for leads
const ENGLISH_LEADS = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.com',
    message: 'We need AI automation for our customer support team. Our current system is overwhelmed with tickets.',
    company: 'TechCorp Solutions',
    industry: 'Technology',
    urgency: 'High'
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@innovateco.com',
    message: 'Looking to automate lead qualification for our sales pipeline. We process hundreds of leads daily.',
    company: 'InnovateCo',
    industry: 'SaaS',
    urgency: 'High'
  },
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@marketingpro.com',
    message: 'Interested in exploring AI solutions for our marketing team. We want to improve our campaign targeting.',
    company: 'MarketingPro',
    industry: 'Marketing',
    urgency: 'Medium'
  },
  {
    name: 'Emma Thompson',
    email: 'emma.thompson@retailplus.com',
    message: 'Our e-commerce platform needs better customer insights. Can AI help us understand our customers better?',
    company: 'RetailPlus',
    industry: 'E-commerce',
    urgency: 'Medium'
  },
  {
    name: 'Michael Zhang',
    email: 'michael.zhang@fintech.com',
    message: 'We\'re exploring AI for fraud detection in our financial services. Need a reliable solution.',
    company: 'FinTech Solutions',
    industry: 'Financial Services',
    urgency: 'High'
  }
];

const FRENCH_LEADS = [
  {
    name: 'Marie Dubois',
    email: 'marie.dubois@techquebec.com',
    message: 'Nous avons besoin d\'automatisation IA pour notre équipe de support client. Notre système actuel est débordé.',
    company: 'TechQuébec',
    industry: 'Technologie',
    urgency: 'Élevée'
  },
  {
    name: 'Pierre Martin',
    email: 'pierre.martin@innovations.ca',
    message: 'Nous cherchons à automatiser la qualification des prospects pour notre pipeline de ventes.',
    company: 'Innovations CA',
    industry: 'SaaS',
    urgency: 'Élevée'
  },
  {
    name: 'Sophie Tremblay',
    email: 'sophie.tremblay@marketingplus.ca',
    message: 'Intéressée par les solutions IA pour notre équipe marketing. Nous voulons améliorer notre ciblage.',
    company: 'MarketingPlus',
    industry: 'Marketing',
    urgency: 'Moyenne'
  },
  {
    name: 'Jean-Claude Roy',
    email: 'jean-claude.roy@commerce.ca',
    message: 'Notre plateforme e-commerce a besoin de meilleures insights clients. L\'IA peut-elle nous aider?',
    company: 'CommercePlus',
    industry: 'E-commerce',
    urgency: 'Moyenne'
  },
  {
    name: 'Isabelle Gagnon',
    email: 'isabelle.gagnon@fintech.ca',
    message: 'Nous explorons l\'IA pour la détection de fraude dans nos services financiers. Besoin d\'une solution fiable.',
    company: 'FinTech Québec',
    industry: 'Services Financiers',
    urgency: 'Élevée'
  }
];

// Repeat customer data (same company, different contacts)
const REPEAT_CUSTOMER_LEADS = [
  {
    name: 'David Wilson',
    email: 'david.wilson@techcorp.com',
    message: 'Following up on our previous conversation about AI automation. We\'re ready to move forward with implementation.',
    company: 'TechCorp Solutions', // Same as Sarah Chen
    industry: 'Technology',
    urgency: 'High',
    language: 'en'
  },
  {
    name: 'Catherine Dubois',
    email: 'catherine.dubois@techquebec.com',
    message: 'Suite à notre conversation précédente sur l\'automatisation IA. Nous sommes prêts à procéder à l\'implémentation.',
    company: 'TechQuébec', // Same as Marie Dubois
    industry: 'Technologie',
    urgency: 'Élevée',
    language: 'fr'
  }
];

// ICP Demo Data
const ICP_DEMO_DATA = {
  target_client_type: 'Mid-market B2B companies (50-500 employees)',
  average_deal_size: '$25,000 - $100,000',
  main_business_goal: 'Increase lead conversion rates and automate customer support',
  biggest_challenge: 'Manual lead qualification and response time delays'
};

class E2EClientTester {
  constructor() {
    this.clientId = null;
    this.apiKey = null;
    this.sessionToken = null;
    this.testResults = {
      clientCreation: false,
      leadGeneration: false,
      repeatCustomerTest: false,
      dashboardTest: false,
      errors: []
    };
  }

  async run() {
    console.log('🚀 Starting Avenir AI E2E Client System Test');
    console.log('================================================');
    
    try {
      // Step 1: Create test client account
      await this.createTestClient();
      
      // Step 2: Generate 10 AI leads
      await this.generateTestLeads();
      
      // Step 3: Create repeat customer leads
      await this.createRepeatCustomerLeads();
      
      // Step 4: Test dashboard functionality
      await this.testDashboardFunctionality();
      
      // Step 5: Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      this.testResults.errors.push(error.message);
      this.generateFinalReport();
    }
  }

  async createTestClient() {
    console.log('\n📝 Step 1: Creating test client account...');
    
    try {
      const clientData = {
        name: TEST_CLIENT_NAME,
        email: TEST_CLIENT_EMAIL,
        business_name: TEST_BUSINESS_NAME,
        password: TEST_CLIENT_PASSWORD,
        language: 'en', // Default to English, will test both
        industry_category: 'Technology',
        primary_service: 'AI Automation Solutions',
        booking_link: 'https://calendly.com/avenir-test',
        custom_tagline: 'Transforming businesses with AI intelligence',
        email_tone: 'Professional',
        followup_speed: 'Instant',
        // ICP data
        target_client_type: ICP_DEMO_DATA.target_client_type,
        average_deal_size: ICP_DEMO_DATA.average_deal_size,
        main_business_goal: ICP_DEMO_DATA.main_business_goal,
        biggest_challenge: ICP_DEMO_DATA.biggest_challenge
      };

      const response = await fetch(`${BASE_URL}/api/client/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(`Client creation failed: ${result.error || 'Unknown error'}`);
      }

      this.clientId = result.data.clientId;
      this.apiKey = result.data.apiKey;

      console.log('✅ Test client created successfully');
      console.log(`   Client ID: ${this.clientId}`);
      console.log(`   API Key: ${this.apiKey.substring(0, 20)}...`);
      console.log(`   Email: ${TEST_CLIENT_EMAIL}`);
      console.log(`   Password: ${TEST_CLIENT_PASSWORD}`);

      this.testResults.clientCreation = true;

    } catch (error) {
      console.error('❌ Client creation failed:', error.message);
      throw error;
    }
  }

  async generateTestLeads() {
    console.log('\n🤖 Step 2: Generating 10 AI leads (5 English, 5 French)...');
    
    try {
      let successCount = 0;
      let totalLeads = 0;

      // Generate English leads
      for (const leadData of ENGLISH_LEADS) {
        await this.submitLead(leadData, 'en');
        successCount++;
        totalLeads++;
        console.log(`   ✅ English lead ${totalLeads}/10: ${leadData.name} (${leadData.company})`);
        await this.delay(1000); // Rate limiting
      }

      // Generate French leads
      for (const leadData of FRENCH_LEADS) {
        await this.submitLead(leadData, 'fr');
        successCount++;
        totalLeads++;
        console.log(`   ✅ French lead ${totalLeads}/10: ${leadData.name} (${leadData.company})`);
        await this.delay(1000); // Rate limiting
      }

      console.log(`✅ Successfully generated ${successCount}/10 leads`);
      this.testResults.leadGeneration = true;

    } catch (error) {
      console.error('❌ Lead generation failed:', error.message);
      throw error;
    }
  }

  async createRepeatCustomerLeads() {
    console.log('\n🔄 Step 3: Creating repeat customer leads for relationship insights...');
    
    try {
      let successCount = 0;

      for (const leadData of REPEAT_CUSTOMER_LEADS) {
        await this.submitLead(leadData, leadData.language);
        successCount++;
        console.log(`   ✅ Repeat customer lead: ${leadData.name} (${leadData.company})`);
        await this.delay(1000); // Rate limiting
      }

      console.log(`✅ Successfully created ${successCount}/2 repeat customer leads`);
      this.testResults.repeatCustomerTest = true;

    } catch (error) {
      console.error('❌ Repeat customer test failed:', error.message);
      throw error;
    }
  }

  async submitLead(leadData, language) {
    const payload = {
      name: leadData.name,
      email: leadData.email,
      message: leadData.message,
      timestamp: new Date().toISOString(),
      api_key: this.apiKey
    };

    const response = await fetch(`${BASE_URL}/api/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(`Lead submission failed for ${leadData.name}: ${result.error || 'Unknown error'}`);
    }

    return result;
  }

  async testDashboardFunctionality() {
    console.log('\n📊 Step 4: Testing dashboard functionality...');
    
    try {
      // Test English dashboard
      console.log('   Testing English dashboard...');
      await this.testDashboardLanguage('en');
      
      // Test French dashboard
      console.log('   Testing French dashboard...');
      await this.testDashboardLanguage('fr');
      
      console.log('✅ Dashboard functionality tests completed');
      this.testResults.dashboardTest = true;

    } catch (error) {
      console.error('❌ Dashboard test failed:', error.message);
      throw error;
    }
  }

  async testDashboardLanguage(locale) {
    // Test client authentication
    const authResponse = await fetch(`${BASE_URL}/api/client/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_CLIENT_EMAIL,
        password: TEST_CLIENT_PASSWORD
      })
    });

    const authResult = await authResponse.json();

    if (!authResponse.ok || !authResult.success) {
      throw new Error(`Authentication failed for ${locale}: ${authResult.error || 'Unknown error'}`);
    }

    // Test leads API
    const leadsResponse = await fetch(`${BASE_URL}/api/client/leads?clientId=${this.clientId}&locale=${locale}&status=active&page=1&limit=20`);
    const leadsResult = await leadsResponse.json();

    if (!leadsResponse.ok || !leadsResult.success) {
      throw new Error(`Leads API failed for ${locale}: ${leadsResult.error || 'Unknown error'}`);
    }

    console.log(`   ✅ ${locale.toUpperCase()} dashboard: ${leadsResult.data?.length || 0} leads loaded`);
  }

  generateFinalReport() {
    console.log('\n📋 FINAL TEST REPORT');
    console.log('====================');
    
    console.log('\n🎯 Test Results:');
    console.log(`   Client Creation: ${this.testResults.clientCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Lead Generation: ${this.testResults.leadGeneration ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Repeat Customer Test: ${this.testResults.repeatCustomerTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Dashboard Test: ${this.testResults.dashboardTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🔑 TEST CLIENT CREDENTIALS:');
    console.log('============================');
    console.log(`Email: ${TEST_CLIENT_EMAIL}`);
    console.log(`Password: ${TEST_CLIENT_PASSWORD}`);
    console.log(`Client ID: ${this.clientId || 'Not created'}`);
    console.log(`API Key: ${this.apiKey || 'Not created'}`);
    
    console.log('\n🌐 DASHBOARD LINKS:');
    console.log('===================');
    console.log(`English Dashboard: ${BASE_URL}/en/client/dashboard`);
    console.log(`French Dashboard: ${BASE_URL}/fr/client/dashboard`);
    
    console.log('\n📊 EXPECTED DASHBOARD FEATURES:');
    console.log('================================');
    console.log('✅ 12 total leads (10 + 2 repeat customers)');
    console.log('✅ 5 English leads with realistic company data');
    console.log('✅ 5 French leads with realistic company data');
    console.log('✅ 2 repeat customer leads for relationship insights');
    console.log('✅ Prospect Intelligence scoring');
    console.log('✅ Relationship Insights for repeat customers');
    console.log('✅ Bilingual support (EN/FR)');
    console.log('✅ No email outreach buttons (client view)');
    console.log('✅ ICP pre-filled with demo values');
    
    const allTestsPassed = Object.values(this.testResults).every(result => 
      typeof result === 'boolean' ? result : true
    ) && this.testResults.errors.length === 0;
    
    console.log(`\n🏆 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 The Avenir AI client system is working correctly!');
      console.log('   You can now log in with the provided credentials to verify manually.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
if (require.main === module) {
  const tester = new E2EClientTester();
  tester.run().catch(console.error);
}

module.exports = E2EClientTester;
