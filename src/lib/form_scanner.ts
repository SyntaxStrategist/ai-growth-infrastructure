// ============================================
// Website Form Scanner
// ============================================
// Analyzes websites for contact forms and patterns
// READ-ONLY: Does not submit forms unless AUTO_SUBMIT_FORMS=true

const SCAN_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 1;
const AUTO_SUBMIT_FORMS = process.env.AUTO_SUBMIT_FORMS === 'true'; // Default: OFF

// ============================================
// Types
// ============================================

export interface FormField {
  name: string;
  type: string;
  required: boolean;
}

export interface FormScanResult {
  hasForm: boolean;
  formCount: number;
  hasMailto: boolean;
  hasCaptcha: boolean;
  formFields: FormField[];
  submitMethod: 'POST' | 'GET' | 'AJAX' | null;
  recommendedApproach: 'email' | 'form-response-bot' | 'manual-outreach';
  metadata: {
    scanned_at: string;
    scan_duration_ms: number;
    page_title?: string;
    contact_paths_found: string[];
    captcha_type?: string;
    error?: string;
  };
}

// ============================================
// Main Scanner Function
// ============================================

/**
 * Scan a website for contact forms and submission patterns
 * 
 * @param url - Website URL to scan
 * @returns Form scan results with analysis
 * 
 * @example
 * const result = await scanWebsiteForForm('https://example.com');
 * if (result.hasForm) {
 *   console.log('Found', result.formCount, 'forms');
 * }
 */
export async function scanWebsiteForForm(url: string): Promise<FormScanResult> {
  const startTime = Date.now();
  
  console.info('[FormScanner] ============================================');
  console.info('[FormScanner] Scanning:', url);

  const defaultResult: FormScanResult = {
    hasForm: false,
    formCount: 0,
    hasMailto: false,
    hasCaptcha: false,
    formFields: [],
    submitMethod: null,
    recommendedApproach: 'manual-outreach',
    metadata: {
      scanned_at: new Date().toISOString(),
      scan_duration_ms: 0,
      contact_paths_found: [],
      error: undefined
    }
  };

  try {
    // Normalize URL
    const normalizedUrl = normalizeUrl(url);
    
    // Attempt to fetch the homepage
    const html = await fetchPageWithTimeout(normalizedUrl, SCAN_TIMEOUT_MS);
    
    if (!html) {
      console.warn('[FormScanner] ⚠️  Empty response');
      defaultResult.metadata.error = 'Empty page response';
      return defaultResult;
    }

    console.info('[FormScanner] ✅ Page fetched, analyzing...');

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : undefined;

    // Detect contact paths
    const contactPaths = findContactPaths(html, normalizedUrl);

    // Analyze forms
    const formMatches = html.match(/<form[^>]*>.*?<\/form>/gi) || [];
    const formCount = formMatches.length;
    const hasForm = formCount > 0;

    console.info(`[FormScanner] Found ${formCount} forms`);

    // Analyze form fields and submission method
    let formFields: FormField[] = [];
    let submitMethod: 'POST' | 'GET' | 'AJAX' | null = null;

    if (hasForm && formMatches.length > 0 && formMatches[0]) {
      const formHtml = formMatches[0]; // Analyze first form
      
      // Extract method
      const methodMatch = formHtml.match(/method=["']?(POST|GET)["']?/i);
      if (methodMatch) {
        submitMethod = methodMatch[1].toUpperCase() as 'POST' | 'GET';
      }

      // Extract form fields
      formFields = extractFormFields(formHtml);
    }

    // Detect AJAX submission patterns
    const hasAjaxSubmit = detectAjaxSubmit(html);
    if (hasAjaxSubmit && !submitMethod) {
      submitMethod = 'AJAX';
    }

    // Detect mailto links
    const hasMailto = /<a[^>]*href=["']mailto:/i.test(html);

    // Detect CAPTCHA
    const captchaInfo = detectCaptcha(html);

    // Determine recommended approach
    const recommendedApproach = determineApproach(hasForm, hasMailto, captchaInfo.hasCaptcha, formFields);

    const scanDuration = Date.now() - startTime;

    const result: FormScanResult = {
      hasForm,
      formCount,
      hasMailto,
      hasCaptcha: captchaInfo.hasCaptcha,
      formFields,
      submitMethod,
      recommendedApproach,
      metadata: {
        scanned_at: new Date().toISOString(),
        scan_duration_ms: scanDuration,
        page_title: pageTitle,
        contact_paths_found: contactPaths,
        captcha_type: captchaInfo.type
      }
    };

    console.info('[FormScanner] ✅ Scan complete:', {
      hasForm,
      formCount,
      hasMailto,
      hasCaptcha: captchaInfo.hasCaptcha,
      recommendedApproach,
      duration: `${scanDuration}ms`
    });

    return result;

  } catch (error) {
    const scanDuration = Date.now() - startTime;
    console.error('[FormScanner] ❌ Scan failed:', error);
    
    return {
      ...defaultResult,
      metadata: {
        ...defaultResult.metadata,
        scan_duration_ms: scanDuration,
        error: error instanceof Error ? error.message : 'Scan failed'
      }
    };
  }
}

// ============================================
// HTTP Fetch with Timeout
// ============================================

/**
 * Fetch page HTML with timeout and retry
 */
async function fetchPageWithTimeout(url: string, timeoutMs: number, retries: number = MAX_RETRIES): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'AvenirAI-ProspectBot/1.0 (+https://aveniraisolutions.ca)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[FormScanner] Response status: ${response.status}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        return null;
      }

      const html = await response.text();
      return html;

    } catch (error) {
      if (attempt < retries) {
        console.warn(`[FormScanner] Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      console.error('[FormScanner] Fetch failed after retries:', error);
      return null;
    }
  }

  return null;
}

// ============================================
// Analysis Functions
// ============================================

/**
 * Find common contact page paths
 */
function findContactPaths(html: string, baseUrl: string): string[] {
  const commonPaths = [
    '/contact',
    '/contact-us',
    '/contactus',
    '/get-in-touch',
    '/contact-form',
    '/reach-us',
    '/support',
    '/help',
    '/inquiry',
    '/get-quote'
  ];

  const found: string[] = [];
  const lowerHtml = html.toLowerCase();

  for (const path of commonPaths) {
    if (lowerHtml.includes(`href="${path}"`) || lowerHtml.includes(`href='${path}'`)) {
      found.push(path);
    }
  }

  return found;
}

/**
 * Extract form fields from form HTML
 */
function extractFormFields(formHtml: string): FormField[] {
  const fields: FormField[] = [];
  
  // Match input, textarea, select elements
  const inputRegex = /<(input|textarea|select)[^>]*>/gi;
  const matches = formHtml.match(inputRegex) || [];

  for (const match of matches) {
    const nameMatch = match.match(/name=["']([^"']+)["']/i);
    const typeMatch = match.match(/type=["']([^"']+)["']/i);
    const required = /required/i.test(match);

    if (nameMatch) {
      fields.push({
        name: nameMatch[1],
        type: typeMatch ? typeMatch[1] : 'text',
        required
      });
    }
  }

  return fields;
}

/**
 * Detect AJAX/JavaScript form submission
 */
function detectAjaxSubmit(html: string): boolean {
  const ajaxPatterns = [
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /\.ajax\s*\(/i,
    /axios\./i,
    /\.post\s*\(/i,
    /addEventListener\s*\(\s*['"]submit['"]/i
  ];

  return ajaxPatterns.some(pattern => pattern.test(html));
}

/**
 * Detect CAPTCHA services
 */
function detectCaptcha(html: string): { hasCaptcha: boolean; type?: string } {
  if (/google\.com\/recaptcha|g-recaptcha/i.test(html)) {
    return { hasCaptcha: true, type: 'reCAPTCHA' };
  }
  
  if (/hcaptcha\.com|h-captcha/i.test(html)) {
    return { hasCaptcha: true, type: 'hCaptcha' };
  }
  
  if (/cloudflare\.com\/turnstile|cf-turnstile/i.test(html)) {
    return { hasCaptcha: true, type: 'Cloudflare Turnstile' };
  }
  
  if (/captcha/i.test(html)) {
    return { hasCaptcha: true, type: 'Unknown CAPTCHA' };
  }

  return { hasCaptcha: false };
}

/**
 * Determine best outreach approach
 */
function determineApproach(
  hasForm: boolean,
  hasMailto: boolean,
  hasCaptcha: boolean,
  formFields: FormField[]
): 'email' | 'form-response-bot' | 'manual-outreach' {
  // If CAPTCHA present, form submission is complex
  if (hasCaptcha) {
    return hasMailto ? 'email' : 'manual-outreach';
  }

  // If form is simple (3-5 fields, no CAPTCHA), form-response-bot is ideal
  if (hasForm && formFields.length >= 2 && formFields.length <= 8) {
    return 'form-response-bot';
  }

  // If mailto links present, email is straightforward
  if (hasMailto) {
    return 'email';
  }

  // If form is too complex or no clear contact method
  if (hasForm && formFields.length > 8) {
    return 'manual-outreach';
  }

  // Default: manual outreach
  return hasForm ? 'form-response-bot' : 'manual-outreach';
}

/**
 * Normalize URL for fetching
 */
function normalizeUrl(url: string): string {
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  return url;
}

// ============================================
// Batch Scanning
// ============================================

/**
 * Scan multiple websites with rate limiting
 */
export async function batchScanWebsites(urls: string[]): Promise<Map<string, FormScanResult>> {
  console.info('[FormScanner] ============================================');
  console.info('[FormScanner] Batch scanning', urls.length, 'websites');

  const results = new Map<string, FormScanResult>();

  for (const url of urls) {
    try {
      const result = await scanWebsiteForForm(url);
      results.set(url, result);
      
      // Small delay between scans to be respectful
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`[FormScanner] Failed to scan ${url}:`, error);
    }
  }

  console.info(`[FormScanner] ✅ Batch complete: ${results.size} sites scanned`);
  return results;
}

// ============================================
// Form Submission (DANGEROUS - Requires Opt-In)
// ============================================

/**
 * ⚠️  DANGEROUS: Submit test data to a form
 * Only enabled if AUTO_SUBMIT_FORMS=true in environment
 * Uses sandbox email for testing
 * 
 * @param url - Form submission URL
 * @param testData - Test form data
 * @returns Submission result
 */
export async function submitTestForm(url: string, testData: Record<string, string>): Promise<{ success: boolean; response?: string; error?: string }> {
  if (!AUTO_SUBMIT_FORMS) {
    return {
      success: false,
      error: 'AUTO_SUBMIT_FORMS not enabled. Set AUTO_SUBMIT_FORMS=true in environment to enable form testing.'
    };
  }

  console.warn('[FormScanner] ⚠️  AUTO_SUBMIT_FORMS enabled - submitting test form');
  console.warn('[FormScanner] URL:', url);
  console.warn('[FormScanner] Test data:', testData);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(testData).toString(),
    });

    const responseText = await response.text();

    console.info('[FormScanner] Form submitted, status:', response.status);

    return {
      success: response.ok,
      response: responseText.substring(0, 500) // First 500 chars
    };

  } catch (error) {
    console.error('[FormScanner] Form submission failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submission failed'
    };
  }
}

// ============================================
// Export API
// ============================================

export const FormScanner = {
  scan: scanWebsiteForForm,
  batchScan: batchScanWebsites,
  submitTest: submitTestForm,
  isAutoSubmitEnabled: () => AUTO_SUBMIT_FORMS
};

