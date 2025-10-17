import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = body as { password?: string };
    
    // Load password from environment variable (no fallback)
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    // Bilingual logging / Journalisation bilingue
    console.log('============================================');
    console.log('[Dashboard Auth] 🔐 Admin Authentication Request');
    console.log('[Auth Tableau] 🔐 Demande d\'authentification admin');
    console.log('============================================');
    
    if (!correctPassword) {
      console.error('[Dashboard Auth] ❌ ADMIN_PASSWORD not set in .env.local');
      console.error('[Auth Tableau] ❌ ADMIN_PASSWORD non défini dans .env.local');
      console.error('[Dashboard Auth] Please set ADMIN_PASSWORD in your .env.local file');
      console.error('[Auth Tableau] Veuillez définir ADMIN_PASSWORD dans votre fichier .env.local');
      return new Response(
        JSON.stringify({ 
          success: false, 
          authorized: false,
          error: "Admin password not configured. Please contact system administrator to set ADMIN_PASSWORD environment variable.",
          configError: true
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log('[Dashboard Auth] ✅ Password source: Using .env.local');
    console.log('[Auth Tableau] ✅ Source du mot de passe : Utilisation de .env.local');
    console.log('[Dashboard Auth] Environment variable: ADMIN_PASSWORD');
    console.log('[Dashboard Auth] Expected password length:', correctPassword.length);
    console.log('[Dashboard Auth] Received password length:', password?.length || 0);

    if (!password || typeof password !== 'string') {
      console.log('[Dashboard Auth] ❌ Invalid password format');
      console.log('[Auth Tableau] ❌ Format de mot de passe invalide');
      return new Response(
        JSON.stringify({ success: false, authorized: false }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Case-sensitive comparison
    if (password === correctPassword) {
      console.log('[Dashboard Auth] ✅ Password match - Access granted');
      console.log('[Auth Tableau] ✅ Mot de passe correct - Accès accordé');
      console.log('============================================');
      return new Response(
        JSON.stringify({ success: true, authorized: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('[Dashboard Auth] ❌ Password mismatch - Access denied');
    console.log('[Auth Tableau] ❌ Mot de passe incorrect - Accès refusé');
    console.log('[Dashboard Auth] Expected:', correctPassword.substring(0, 3) + '***');
    console.log('[Dashboard Auth] Received:', password.substring(0, 3) + '***');
    console.log('============================================');
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

export const runtime = "edge";
