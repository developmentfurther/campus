import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { cookies } from "next/headers"; // 👈 Importar cookies

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

      // 🔥 CORRECCIÓN CRÍTICA PARA NEXT.JS 15:
      // Ahora debemos esperar a que cookies() se resuelva
      const cookieStore = await cookies(); 

      cookieStore.set("admin_2fa_valid", "true", {
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
        // Recuerda: false en localhost para que no falle por falta de HTTPS
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax",
        httpOnly: false, 
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error 2FA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}