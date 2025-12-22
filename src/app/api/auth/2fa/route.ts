import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, secret } = body;

    // 1. GENERAR QR
    if (action === "generate") {
      const newSecret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri("Admin", "FurtherCampus", newSecret);
      const imageUrl = await qrcode.toDataURL(otpauth);

      return NextResponse.json({ secret: newSecret, qrCode: imageUrl });
    }

    // 2. VERIFICAR Y CREAR COOKIE
    if (action === "verify") {
      const isValid = authenticator.check(token, secret);

      if (!isValid) {
        return NextResponse.json({ ok: false, error: "Código inválido" }, { status: 400 });
      }

      console.log("✅ Código válido - Estableciendo cookie...");

      // 🔥 SOLUCIÓN: Crear response con cookie en headers
      const response = NextResponse.json({ ok: true });

      // Configuración de cookie optimizada para producción
      const cookieOptions = [
        'admin_2fa_valid=true',
        'Max-Age=604800', // 7 días en segundos
        'Path=/',
        'SameSite=Lax',
        process.env.NODE_ENV === 'production' ? 'Secure' : '', // Solo HTTPS en producción
      ].filter(Boolean).join('; ');

      response.headers.set('Set-Cookie', cookieOptions);

      console.log("🍪 Cookie establecida:", cookieOptions);

      return response;
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Error 2FA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}