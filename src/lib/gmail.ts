/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { google } from "googleapis";
import { kv } from "@vercel/kv";
import crypto from "crypto";

const KV_TOKEN_KEY = process.env.GMAIL_TOKENS_KV_KEY || "gmail:oauth:tokens";
const ENCRYPTION_KEY = process.env.GMAIL_ENCRYPTION_KEY || "default-key-change-in-production";

// Generate a 32-byte key from the encryption key
function getKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16); // 16 bytes for AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data and base64 encode
  const combined = iv.toString('hex') + encrypted;
  return Buffer.from(combined, 'hex').toString('base64');
}

function decrypt(encryptedText: string): string {
  const key = getKey();
  
  // Decode from base64 and extract IV
  const combined = Buffer.from(encryptedText, 'base64').toString('hex');
  const iv = Buffer.from(combined.slice(0, 32), 'hex'); // First 16 bytes (32 hex chars)
  const encrypted = combined.slice(32); // Rest is the encrypted data
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "";
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Gmail OAuth env vars (GMAIL_CLIENT_ID/SECRET/REDIRECT_URI)");
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client;
}

export async function getStoredTokens(): Promise<any | null> {
  // Try encrypted env var first (most reliable for Vercel)
  try {
    const encryptedTokens = process.env.GMAIL_REFRESH_TOKEN;
    if (encryptedTokens) {
      const decrypted = decrypt(encryptedTokens);
      return JSON.parse(decrypted);
    }
  } catch {
    // ignore and try KV fallback
  }
  
  // Fallback to KV
  try {
    if (kv) {
      const t = await kv.get<string>(KV_TOKEN_KEY);
      if (t) return JSON.parse(t);
    }
  } catch {
    // ignore
  }
  
  // Last resort: plain env var
  try {
    const envTokens = process.env.GMAIL_TOKENS_JSON;
    if (envTokens) return JSON.parse(envTokens);
  } catch {
    // ignore
  }
  return null;
}

export async function storeTokens(tokens: any) {
  const serialized = JSON.stringify(tokens);
  if (!serialized) return;
  
  // Encrypt and store in env var (for Vercel compatibility)
  try {
    const encrypted = encrypt(serialized);
    // Note: In production, you'd need to update the env var via Vercel API
    // For now, we'll store in KV as backup
    if (kv) {
      await kv.set(KV_TOKEN_KEY, serialized);
    }
    // Log the encrypted token for manual env var update
    console.log(`GMAIL_REFRESH_TOKEN=${encrypted}`);
  } catch {
    // ignore
  }
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function getAuthorizedGmail() {
  const oauth2Client = getOAuth2Client();
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new Error("Gmail not connected. Visit /api/gmail/auth to authorize");
  }
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getGmailProfile() {
  const gmail = await getAuthorizedGmail();
  try {
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data;
  } catch (error) {
    console.error('Failed to fetch Gmail profile:', error);
    return null;
  }
}

export function toBase64Url(input: string) {
  // Ensure proper UTF-8 encoding for international characters
  const utf8Buffer = Buffer.from(input, 'utf8');
  return utf8Buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildHtmlEmail(opts: { to: string; from: string; subject: string; name: string; aiSummary: string; locale?: string; profileEmail?: string; }) {
  const { to, from, subject, name, aiSummary, locale = 'en', profileEmail } = opts;
  const isFrench = locale === 'fr';
  
  // Use consistent sender identity
  const senderEmail = profileEmail || from;
  const senderName = "Avenir AI Solutions";
  const greeting = isFrench ? `Merci, <span class="gradient">${name}</span> — nous avons reçu votre demande` : `Thanks, <span class="gradient">${name}</span> — we got your request`;
  const bodyText = isFrench ? `Un stratège Avenir vous contactera sous peu. En attendant, voici un résumé IA de vos objectifs :` : `An Avenir strategist will reach out shortly. Meanwhile, here's an AI summary of your goals:`;
  const aiSummaryLabel = isFrench ? `Résumé IA` : `AI Summary`;
  const footerText = isFrench ? `Si ce n'était pas vous, veuillez ignorer cet e-mail.` : `If this wasn't you, please ignore this email.`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" />
  <meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
  <style>
    body { margin:0; padding:0; background:#0a0a0a; color:#eaeaea; font-family:Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    .container { max-width:640px; margin:0 auto; padding:24px; }
    .badge { display:inline-block; padding:6px 10px; border-radius:9999px; border:1px solid rgba(255,255,255,0.18); font-size:12px; opacity:.9; }
    .h1 { font-size:24px; line-height:1.2; margin:16px 0 8px; }
    .card { border:1px solid rgba(255,255,255,0.14); border-radius:12px; padding:16px; background:linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08)); }
    .muted { color:#bdbdbd; font-size:14px; }
    .gradient { background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    a { color:#06b6d4; }
  </style></head><body>
  <div class="container">
    <div class="badge">Avenir AI Solutions</div>
    <h1 class="h1">${greeting}</h1>
    <p class="muted">${bodyText}</p>
    <div class="card"><strong>${aiSummaryLabel}</strong><div style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(aiSummary || "(unavailable)")}</div></div>
    <p class="muted" style="margin-top:16px;">${footerText}</p>
  </div></body></html>`;

  // Encode subject line for proper UTF-8 handling
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
  
  const headers = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ].join("\r\n");

  const raw = `${headers}\r\n\r\n${html}`;
  return toBase64Url(raw);
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


