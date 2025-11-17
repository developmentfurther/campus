import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin"; // tu admin SDK

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body.alumnos)) {
      return NextResponse.json(
        { error: "Formato inválido. Enviar { alumnos: [...] }" },
        { status: 400 }
      );
    }

    const batchRef = adminDb.collection("alumnos").doc("batch_1");

    const payload: Record<string, any> = {};

    for (const alumno of body.alumnos) {
      if (!alumno.userKey || !alumno.data) continue;
      payload[alumno.userKey] = alumno.data;
    }

    await batchRef.set(payload, { merge: true });

    return NextResponse.json({
      ok: true,
      count: body.alumnos.length,
      message: "Alumnos sincronizados correctamente",
    });

  } catch (error) {
    console.error("🔥 Error en sync-alumnos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
