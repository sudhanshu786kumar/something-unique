import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // Check if the path starts with /chat
  if (request.nextUrl.pathname.startsWith('/chat')) {
    const token = await getToken({ req: request });

    // If no token exists, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/api/chat/:path*',
    '/api/order/:path*'
  ]
}; 