import { NextRequest } from "next/server";
import bcrypt from 'bcrypt';

import { handleApiError } from '../../../lib/error-handler';
import { getClientIP, checkBruteForceProtection, recordFailedAttempt, recordSuccessfulAttempt, createSecurityResponse, loginAttempts, validateCSRFProtection } from '../../../lib/security';
import { AdminAuthSchema, validateData } from '../../../lib/validation-schemas';

// Force Node.js runtime for bcrypt compatibility
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Security: Validate CSRF protection
  const csrfValidation = validateCSRFProtection(req);
  if (!csrfValidation.valid) {
    console.log('[Dashboard Auth] ❌ CSRF validation failed:', csrfValidation.error);
    return createSecurityResponse(csrfValidation.error || 'CSRF validation failed', 403);
  }
  
  // Security: Brute force protection
  const clientIP = getClientIP(req);
  const bruteForceCheck = checkBruteForceProtection(clientIP);
  
  if (!bruteForceCheck.allowed) {
    console.log(`[Dashboard Auth] 🚫 Brute force protection triggered for IP: ${clientIP}`);
    console.log(`[Auth Tableau] 🚫 Protection contre la force brute déclenchée pour IP: ${clientIP}`);
    return createSecurityResponse(
      `Too many failed attempts. Please try again in ${Math.ceil(15 - (Date.now() - (loginAttempts.get(clientIP)?.lastAttempt || 0)) / 60000)} minutes.`,
      429
    );
  }
  
  try {
    const rawBody = await req.json().catch(() => null);
    
    if (!rawBody || typeof rawBody !== "object") {
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate input with Zod schema
    const validation = validateData(AdminAuthSchema, rawBody);
    
    if (!validation.success) {
      console.error('[Dashboard Auth] ❌ Validation failed:', validation.error);
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ success: false, authorized: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = validation.data;
    
    // Load password hash from environment variable (bcrypt hash)
    // For backwards compatibility, try ADMIN_PASSWORD_HASH first, then fall back to ADMIN_PASSWORD
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD;
    const isLegacyPassword = !process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD;
    
    // Bilingual logging / Journalisation bilingue
    console.log('============================================');
    console.log('[Dashboard Auth] 🔐 Admin Authentication Request');
    console.log('[Auth Tableau] 🔐 Demande d\'authentification admin');
    console.log('============================================');
    
    if (!passwordHash) {
      console.error('[Dashboard Auth] ❌ ADMIN_PASSWORD_HASH not set in .env.local');
      console.error('[Auth Tableau] ❌ ADMIN_PASSWORD_HASH non défini dans .env.local');
      console.error('[Dashboard Auth] Please set ADMIN_PASSWORD_HASH in your .env.local file');
      console.error('[Auth Tableau] Veuillez définir ADMIN_PASSWORD_HASH dans votre fichier .env.local');
      return new Response(
        JSON.stringify({ 
          success: false, 
          authorized: false,
          error: "Admin password not configured. Please contact system administrator to set ADMIN_PASSWORD_HASH environment variable.",
          configError: true
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log('[Dashboard Auth] ✅ Password source: Using .env.local');
    console.log('[Auth Tableau] ✅ Source du mot de passe : Utilisation de .env.local');
    console.log('[Dashboard Auth] Environment variable:', isLegacyPassword ? 'ADMIN_PASSWORD (legacy)' : 'ADMIN_PASSWORD_HASH');
    console.log('[Dashboard Auth] Received password length:', password.length);

    // Secure password comparison using bcrypt (timing-safe)
    let isPasswordValid = false;
    
    if (isLegacyPassword) {
      // Legacy: plain-text comparison (for backwards compatibility during migration)
      console.warn('[Dashboard Auth] ⚠️ Using legacy plain-text password comparison. Please migrate to ADMIN_PASSWORD_HASH.');
      isPasswordValid = password === passwordHash;
    } else {
      // Secure: bcrypt comparison (timing-safe)
      try {
        isPasswordValid = await bcrypt.compare(password, passwordHash);
      } catch (error) {
        console.error('[Dashboard Auth] ❌ Bcrypt comparison error:', error);
        recordFailedAttempt(clientIP);
        return new Response(
          JSON.stringify({ success: false, authorized: false, error: 'Authentication error' }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (isPasswordValid) {
      console.log('[Dashboard Auth] ✅ Password match - Access granted');
      console.log('[Auth Tableau] ✅ Mot de passe correct - Accès accordé');
      console.log('============================================');
      
      // Security: Record successful attempt
      recordSuccessfulAttempt(clientIP);
      
      return new Response(
        JSON.stringify({ success: true, authorized: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('[Dashboard Auth] ❌ Password mismatch - Access denied');
    console.log('[Auth Tableau] ❌ Mot de passe incorrect - Accès refusé');
    console.log('[Dashboard Auth] Password comparison failed');
    console.log('============================================');
    
    // Security: Record failed attempt
    recordFailedAttempt(clientIP, req);
    
    return new Response(
      JSON.stringify({ success: false, authorized: false }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[Dashboard Auth] Authentication error:', error);
    console.error('[Auth Tableau] Erreur d\'authentification:', error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
