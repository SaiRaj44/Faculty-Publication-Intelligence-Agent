import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin only routes
    if (path.startsWith('/settings/users') || path.startsWith('/api/settings/users')) {
      if (token?.role !== 'SUPER_ADMIN' && token?.role !== 'INSTITUTION_ADMIN') {
        return NextResponse.rewrite(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/publications/:path*',
    '/reports/:path*',
    '/faculty/:path*',
    '/departments/:path*',
    '/settings/:path*',
    // API routes except auth
    '/api/((?!auth).*)',
  ],
};
