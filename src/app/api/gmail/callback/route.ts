import { NextRequest } from "next/server";
import { getOAuth2Client, storeTokens, getGmailProfile } from "../../../../lib/gmail";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    await storeTokens(tokens);
    
    // Log the encrypted refresh token for manual env var update
    const { encrypt } = await import("../../../../lib/gmail");
    const serialized = JSON.stringify(tokens);
    const encrypted = encrypt(serialized);
    console.log(`GMAIL_REFRESH_TOKEN=${encrypted}`);
    
    // Fetch and log current Gmail profile for verification
    try {
      const profile = await getGmailProfile();
      console.log('Gmail profile updated:', {
        email: profile?.emailAddress,
        messagesTotal: profile?.messagesTotal,
        threadsTotal: profile?.threadsTotal
      });
    } catch (profileError) {
      console.error('Failed to fetch Gmail profile after OAuth:', profileError);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Gmail OAuth completed successfully. Profile refreshed." 
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OAuth callback failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const runtime = "nodejs";

