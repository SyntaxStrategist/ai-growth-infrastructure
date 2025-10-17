// ============================================
// Form Tester - Tests contact forms and measures response
// ============================================

import { FormTestResult, ProspectCandidate } from '../types';

export interface FormTestConfig {
  testMessage: string;
  testEmail: string;
  testName: string;
  timeout: number; // minutes
}

/**
 * Test a prospect's contact form by submitting a test inquiry
 * In development mode, simulates the test
 */
export async function testContactForm(
  prospect: ProspectCandidate,
  config: FormTestConfig
): Promise<FormTestResult> {
  console.log('[FormTester] ============================================');
  console.log('[FormTester] Testing contact form for:', prospect.business_name);
  console.log('[FormTester] Form URL:', prospect.form_url || 'Not specified');
  console.log('[FormTester] Test Mode:', process.env.NODE_ENV === 'development' ? 'Simulated' : 'Live');

  const testStartTime = new Date();

  // In development mode, simulate the test
  if (process.env.NODE_ENV === 'development' || !prospect.form_url) {
    console.log('[FormTester] 🧪 Simulating form test...');
    return simulateFormTest(prospect, testStartTime);
  }

  // Production: Actual form submission would go here
  // This would use Puppeteer or Playwright to:
  // 1. Navigate to form_url
  // 2. Fill in fields
  // 3. Submit
  // 4. Monitor the test email inbox for response

  try {
    // Placeholder for actual implementation
    console.log('[FormTester] ⚠️  Live form testing not yet implemented');
    console.log('[FormTester] Falling back to simulation...');
    return simulateFormTest(prospect, testStartTime);

  } catch (error) {
    console.error('[FormTester] ❌ Test failed:', error);
    return {
      prospect_id: prospect.id!,
      test_submitted_at: testStartTime,
      test_status: 'failed',
      score: 0,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Simulate form test for development/testing
 */
function simulateFormTest(
  prospect: ProspectCandidate,
  testStartTime: Date
): FormTestResult {
  // Simulate different response scenarios based on business name
  const scenarios = [
    {
      pattern: /construction|home/i,
      response_time: 180, // 3 hours
      has_autoresponder: false,
      tone: 'none' as const,
      score: 15
    },
    {
      pattern: /real estate|marketing/i,
      response_time: 30, // 30 minutes
      has_autoresponder: true,
      tone: 'robotic' as const,
      score: 45
    },
    {
      pattern: /tech|consulting/i,
      response_time: 5, // 5 minutes
      has_autoresponder: true,
      tone: 'human' as const,
      score: 75
    },
    {
      pattern: /law|finance/i,
      response_time: 1440, // 24 hours
      has_autoresponder: false,
      tone: 'none' as const,
      score: 5
    },
    {
      pattern: /event|services/i,
      response_time: 60, // 1 hour
      has_autoresponder: true,
      tone: 'personalized' as const,
      score: 85
    }
  ];

  // Find matching scenario or use default
  const scenario = scenarios.find(s => s.pattern.test(prospect.business_name)) || {
    response_time: 120,
    has_autoresponder: false,
    tone: 'none' as const,
    score: 25
  };

  const responseTime = new Date(testStartTime.getTime() + scenario.response_time * 60000);

  const autoresponderContent = scenario.has_autoresponder
    ? generateSimulatedAutoresponder(prospect, scenario.tone)
    : null;

  console.log('[FormTester] ✅ Simulation complete');
  console.log('[FormTester] Response time:', scenario.response_time, 'minutes');
  console.log('[FormTester] Has autoresponder:', scenario.has_autoresponder);
  console.log('[FormTester] Tone:', scenario.tone);
  console.log('[FormTester] Score:', scenario.score);

  return {
    prospect_id: prospect.id!,
    test_submitted_at: testStartTime,
    response_received_at: responseTime,
    response_time_minutes: scenario.response_time,
    has_autoresponder: scenario.has_autoresponder,
    autoresponder_tone: scenario.tone,
    autoresponder_content: autoresponderContent,
    score: scenario.score,
    test_status: 'completed',
    metadata: {
      simulated: true,
      test_message: 'Test inquiry about services'
    }
  };
}

/**
 * Generate simulated autoresponder based on tone
 */
function generateSimulatedAutoresponder(
  prospect: ProspectCandidate,
  tone: 'robotic' | 'human' | 'personalized' | 'none'
): string | null {
  if (tone === 'none') return null;

  const templates = {
    robotic: `Thank you for your inquiry. We have received your message and will respond within 24-48 business hours. Reference ID: ${Math.random().toString(36).substring(7).toUpperCase()}`,
    
    human: `Hi there!\n\nThanks for reaching out to ${prospect.business_name}. We've received your message and someone from our team will get back to you soon.\n\nBest regards,\n${prospect.business_name} Team`,
    
    personalized: `Hello!\n\nThank you for contacting ${prospect.business_name}. We're excited to learn more about your needs!\n\nOur team has been notified of your inquiry and will review it shortly. We typically respond within a few hours during business hours.\n\nIn the meantime, feel free to check out our recent work at ${prospect.website}.\n\nLooking forward to connecting!\n\n${prospect.business_name}`
  };

  return templates[tone];
}

/**
 * Batch test multiple prospects
 */
export async function batchTestProspects(
  prospects: ProspectCandidate[],
  config: FormTestConfig
): Promise<FormTestResult[]> {
  console.log('[FormTester] ============================================');
  console.log('[FormTester] Starting batch test for', prospects.length, 'prospects');

  const results: FormTestResult[] = [];

  for (const prospect of prospects) {
    try {
      const result = await testContactForm(prospect, config);
      results.push(result);
      
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('[FormTester] ❌ Failed to test:', prospect.business_name, error);
    }
  }

  console.log('[FormTester] ✅ Batch test complete:', results.length, 'results');
  return results;
}

