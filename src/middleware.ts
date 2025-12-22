// middleware.ts (en la raíz del proyecto, al lado de app/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log("🔍 Middleware ejecutándose en:", pathname);
  
  // Rutas que requieren 2FA
  const requiresAdmin = pathname.startsWith('/dashboard');
  const is2FAPage = pathname === '/2fa';
  
  // Si no es ruta protegida o es la página de 2FA, permitir
  if (!requiresAdmin || is2FAPage) {
    return NextResponse.next();
  }

  // Verificar cookie de 2FA
  const has2FA = request.cookies.get('admin_2fa_valid')?.value === 'true';
  
  console.log("🍪 Cookie 2FA:", has2FA ? "✅ Válida" : "❌ No encontrada");
  
  // Si no tiene 2FA válido, redirigir
  if (!has2FA) {
    console.log("🚫 Redirigiendo a /2fa");
    const url = new URL('/2fa', request.url);
    return NextResponse.redirect(url);
  }

  console.log("✅ Acceso permitido a dashboard");
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/2fa'
  ]
};