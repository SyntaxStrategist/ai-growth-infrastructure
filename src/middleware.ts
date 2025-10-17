import { NextRequest, NextResponse } from 'next/server';

// Routes that should be redirected with locale detection
const baseRoutes = [
  '/client/signup',
  '/client/login',
  '/client/dashboard',
  '/client/settings',
  '/client/api-access',
  '/admin/login',
  '/admin/dashboard',
  '/admin/settings',
  '/admin/prospect-intelligence',
  '/dashboard',
  '/dashboard/insights',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a base route (without locale)
  const isBaseRoute = baseRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if path already has a locale
  const hasLocale = pathname.startsWith('/en/') || pathname.startsWith('/fr/');

  if (isBaseRoute && !hasLocale) {
    console.log('[Middleware] Base route detected:', pathname);
    
    // Detect preferred language
    const preferredLocale = detectPreferredLocale(request);
    
    console.log('[Middleware] Detected locale:', preferredLocale);
    console.log('[Middleware] Redirecting to:', `/${preferredLocale}${pathname}`);
    
    // Redirect to locale-prefixed route
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;
    
    return NextResponse.redirect(url);
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

/**
 * Detect user's preferred locale from:
 * 1. localStorage (via cookie set by client)
 * 2. Accept-Language header (browser preference)
 * 3. Default to 'en'
 */
function detectPreferredLocale(request: NextRequest): 'en' | 'fr' {
  // Check for avenir_language cookie (set by client-side localStorage sync)
  const languageCookie = request.cookies.get('avenir_language');
  if (languageCookie?.value === 'en' || languageCookie?.value === 'fr') {
    console.log('[Middleware] Using language from cookie:', languageCookie.value);
    return languageCookie.value;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase());
    
    // Check if French is preferred
    if (languages.some(lang => lang.startsWith('fr'))) {
      console.log('[Middleware] Using browser language: fr');
      return 'fr';
    }
  }

  // Default to English
  console.log('[Middleware] Using default language: en');
  return 'en';
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
