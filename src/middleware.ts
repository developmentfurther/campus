// middleware.ts (en la raíz del proyecto, al lado de app/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas que requieren 2FA
  const requiresAdmin = pathname.startsWith('/dashboard');
  const is2FAPage = pathname === '/2fa';
  
  if (!requiresAdmin || is2FAPage) {
    return NextResponse.next();
  }

  // Verificar si tiene cookie de 2FA válida
  const has2FA = request.cookies.get('admin_2fa_valid')?.value === 'true';
  
  // Si intenta acceder al dashboard sin 2FA, redirigir
  if (!has2FA) {
    console.log('🚫 Middleware: Sin 2FA, redirigiendo a /2fa');
    return NextResponse.redirect(new URL('/2fa', request.url));
  }

  return NextResponse.next();
}

// Configurar qué rutas debe interceptar el middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/2fa'
  ]
};