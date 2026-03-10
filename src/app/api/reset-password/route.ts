import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email requerido" }, { status: 400 });
    }

    // Generar link de reset con Firebase Admin
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Llamar al webhook de n8n
    const n8nResponse = await fetch(process.env.N8N_RESET_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resetLink }),
    });

   if (!n8nResponse.ok) {
  const body = await n8nResponse.text();
  console.error("n8n respondió:", n8nResponse.status, body);
  throw new Error("Error al llamar al webhook de n8n");
}

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Si el usuario no existe en Auth
    if (err.code === "auth/user-not-found") {
      return NextResponse.json({ ok: false, error: "auth/user-not-found" }, { status: 404 });
    }
    console.error("🔥 Error reset-password:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
