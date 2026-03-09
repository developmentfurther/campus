// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const role = request.cookies.get('user_role')?.value;
  const has2FA = request.cookies.get('admin_2fa_valid')?.value === 'true';

  // ── /admin ──────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
  if (role !== 'admin') return NextResponse.redirect(new URL('/login', request.url));
  if (!has2FA) return NextResponse.redirect(new URL('/2fa', request.url));
  return NextResponse.next();
}

  // ── /profesores ─────────────────────────────────────────
  if (pathname.startsWith('/profesores')) {
    if (role !== 'profesor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // ── /dashboard ──────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!role) return NextResponse.redirect(new URL('/login', request.url));

    // Admin y profesor no deberían estar en /dashboard
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'profesor') return NextResponse.redirect(new URL('/profesores', request.url));

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profesores/:path*',
  ],
};