import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { normalizeSubdomain } from './lib/utils';

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  
  // Define root domains
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'plas.rw';
  const localDomain = 'localhost';
  const lvhDomain = 'lvh.me';

  // 1. Ignore main domains (Admin / Standard flow)
  if (
    hostname === rootDomain ||
    hostname === `dash.${rootDomain}` ||
    hostname === localDomain ||
    hostname === `www.${rootDomain}`
  ) {
    return NextResponse.next();
  }

  // 2. Extract subdomain
  let subdomain = '';
  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, '');
  } else if (hostname.endsWith(`.${lvhDomain}`)) {
    subdomain = hostname.replace(`.${lvhDomain}`, '');
  } else if (hostname.endsWith(`.${localDomain}`)) {
    subdomain = hostname.replace(`.${localDomain}`, '');
  }

  // Normalize and validate subdomain
  subdomain = normalizeSubdomain(subdomain);
  if (!subdomain || subdomain === 'www' || subdomain === 'dash') {
    return NextResponse.next();
  }

  // 3. Check for cached business ID in cookie
  const cachedId = request.cookies.get('business-id')?.value;
  if (cachedId) {
    const res = NextResponse.next();
    res.headers.set('x-business-id', cachedId);
    return res;
  }

  // 4. Perform lookup (⚠️ To be replaced with KV/Redis for even better performance)
  try {
    const lookupUrl = new URL(`/api/business/lookup?subdomain=${subdomain}`, request.url);
    const lookupResponse = await fetch(lookupUrl);
    
    if (!lookupResponse.ok) {
      // Invalid tenant - redirect to 404 or a dedicated "not found" page
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    const business = await lookupResponse.json();
    if (!business?.id) {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    const response = NextResponse.next();
    
    // Set headers for the current request
    response.headers.set('x-business-id', business.id);
    
    // Set persistent cookie for subsequent requests
    response.cookies.set('business-id', business.id, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      domain: process.env.NODE_ENV === 'development' ? '.lvh.me' : `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'plas.rw'}`,
      sameSite: 'lax',
    });
    
    return response;
  } catch (error) {
    console.error('Middleware lookup error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|Assets|logo|favicon.png).*)'],
};
