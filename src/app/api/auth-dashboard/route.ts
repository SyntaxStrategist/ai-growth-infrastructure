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
    
    // Debug logging for password source
    const hasEnvPassword = !!process.env.ADMIN_DASHBOARD_PASSWORD;
    console.log('[Dashboard Auth] Password source:', hasEnvPassword ? 'Using env password' : 'Using fallback password');
    console.log('[Dashboard Auth] Input password length:', password?.length || 0);
    console.log('[Dashboard Auth] Input password value:', password);
    
    const correctPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "AvenirAI2025";

    if (!password || typeof password !== 'string') {
      console.log('[Dashboard Auth] Invalid password format');
      return new Response(
        JSON.stringify({ success: false, authorized: false }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Case-sensitive comparison
    if (password === correctPassword) {
      console.log('[Dashboard Auth] ✅ Password match - access granted');
      return new Response(
        JSON.stringify({ success: true, authorized: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('[Dashboard Auth] ❌ Password mismatch - access denied');
    return new Response(
      JSON.stringify({ success: false, authorized: false }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[Dashboard Auth] Authentication error:', error);
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "edge";
