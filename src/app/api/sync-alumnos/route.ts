import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// ===============================
// 🔥 Inicializar Firebase Admin
// ===============================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST() {
  try {
    const db = admin.firestore();

    const snaps = await db.collection("alumno_raw").get();
    const results: any[] = [];

    for (const batch of snaps.docs) {
      const data = batch.data();

      for (const key in data) {
        if (!key.startsWith("user_")) continue;

        const alumno = data[key];
        const email = alumno.email?.toLowerCase();
        if (!email) continue;

        const basePassword =
          alumno.password?.toLowerCase()?.replace(/\s+/g, "") || "";

        const firstCourse =
          alumno.cursosAsignados?.[0]?.curso?.toLowerCase() || "";

        const finalPassword = `${basePassword}${firstCourse}`;

        try {
          let userRecord;

          try {
            userRecord = await admin.auth().getUserByEmail(email);
          } catch {
            userRecord = await admin.auth().createUser({
              email,
              password: finalPassword,
              displayName: alumno.nombre || "",
            });
          }

          await batch.ref.update({
            [`${key}.uid`]: userRecord.uid,
            [`${key}.role`]: alumno.role || "alumno",
            [`${key}.passwordFinal`]: finalPassword,
          });

          results.push({
            email,
            uid: userRecord.uid,
            password: finalPassword,
            status: "ok",
          });
        } catch (err: any) {
          console.error("❌ Error procesando", email, err);
          results.push({
            email,
            error: err.message,
            status: "error",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (err: any) {
    console.error("🔥 Error general:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
