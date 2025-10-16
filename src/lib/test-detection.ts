/**
 * Test Data Detection Utility
 * 
 * Automatically identifies test/demo data based on common patterns
 * to enable filtering in production analytics
 */

/**
 * Keywords that indicate test data
 */
const TEST_KEYWORDS = [
  'test',
  'demo',
  'example',
  'sample',
  'dummy',
  'fake',
  'sandbox',
];

/**
 * Domains that indicate test data
 */
const TEST_DOMAINS = [
  'example.com',
  'example.org',
  'test.com',
  'demo.com',
  'localhost',
];

/**
 * Check if a string contains test indicators
 */
export function containsTestKeywords(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const lowerValue = value.toLowerCase();

  // Check for test keywords
  for (const keyword of TEST_KEYWORDS) {
    if (lowerValue.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an email contains test domains
 */
export function isTestEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const lowerEmail = email.toLowerCase();

  // Check for test domains
  for (const domain of TEST_DOMAINS) {
    if (lowerEmail.includes(`@${domain}`) || lowerEmail.endsWith(domain)) {
      return true;
    }
  }

  // Check for test keywords in email
  return containsTestKeywords(email);
}

/**
 * Determine if client data is test data
 */
export function isTestClient(data: {
  business_name?: string;
  name?: string;
  email?: string;
}): boolean {
  // Check business name
  if (data.business_name && containsTestKeywords(data.business_name)) {
    return true;
  }

  // Check contact name
  if (data.name && containsTestKeywords(data.name)) {
    return true;
  }

  // Check email
  if (data.email && isTestEmail(data.email)) {
    return true;
  }

  return false;
}

/**
 * Determine if lead data is test data
 */
export function isTestLead(data: {
  name?: string;
  email?: string;
  message?: string;
}): boolean {
  // Check name
  if (data.name && containsTestKeywords(data.name)) {
    return true;
  }

  // Check email
  if (data.email && isTestEmail(data.email)) {
    return true;
  }

  // Check message
  if (data.message && containsTestKeywords(data.message)) {
    return true;
  }

  return false;
}

/**
 * Log test data detection
 */
export function logTestDetection(
  entity: string,
  isTest: boolean,
  reason?: string
): void {
  if (isTest) {
    console.log(`[TestDetection] ⚠️  ${entity} marked as TEST DATA`);
    if (reason) {
      console.log(`[TestDetection] Reason: ${reason}`);
    }
  } else {
    console.log(`[TestDetection] ✅ ${entity} marked as PRODUCTION DATA`);
  }
}

