import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { addProfesorToBatch } from "@/lib/profesorBatches";

export async function POST(req: NextRequest) {
  try {
    const { email, password, nombre, apellido, idExterno, idiomasQueEnseña, nivel } = await req.json();

    if (!email || !password || !nombre || !apellido) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Crear cuenta en Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${nombre} ${apellido}`,
    });

    // Agregar al batch de profesores
    const result = await addProfesorToBatch({
      uid: userRecord.uid,
      email,
      nombre,
      apellido,
      idExterno,
      idiomasQueEnseña,
      nivel,
    });

    return NextResponse.json({ success: true, uid: userRecord.uid, ...result });
  } catch (error: any) {
    console.error("Error creando profesor:", error);

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}