import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/crypto';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('golden_crumb_session');

  // Verify token
  let session = null;
  if (sessionCookie && sessionCookie.value) {
    session = await verifyToken(sessionCookie.value);
  }

  // Route protection rules:
  // 1. Admin Workspace protection (/admin)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('staff', 'true');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const staffRoles = ['admin', 'kitchen', 'courier'];
    if (!staffRoles.includes(session.role as string)) {
      // If customer tries to access admin, redirect to customer dashboard
      const unauthorizedUrl = new URL('/my-orders', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // 2. Customer Dashboard protection (/my-orders)
  if (pathname.startsWith('/my-orders')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/my-orders/:path*'],
};
