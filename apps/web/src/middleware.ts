import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and Next.js internals
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in cookie (set by api-client on login)
  const token = req.cookies.get('wa-access-token')?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  // Forward tenant subdomain header for whitelabel routing
  const hostname = req.headers.get('host') ?? '';
  const subdomain = hostname.split('.')[0];
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (!isLocalhost && subdomain && subdomain !== 'www' && subdomain !== 'app') {
    response.headers.set('x-tenant-slug', subdomain);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
