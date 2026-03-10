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

function normalizeEmail(raw: string | undefined | null) {
  if (!raw) return null;
  const email = raw.toLowerCase().trim().replace(/\s+/g, "").split(/[;,/]+/)[0];
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return valid ? email : null;
}

export async function POST() {
  try {
    const db = admin.firestore();
    const snaps = await db.collection("alumnos").get();
    const results: any[] = [];

    console.log("📌 Batches encontrados:", snaps.size);

    for (const docSnap of snaps.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false;

      for (const key in data) {
        if (!key.startsWith("user_")) continue;

        const alumno = data[key];

        if (alumno.uid) {
          results.push({
            email: alumno.email,
            uid: alumno.uid,
            status: "skipped",
            wasCreated: false,
          });
          continue;
        }

        const email = normalizeEmail(alumno.email);

        if (!email) {
          console.warn(`❌ Email inválido en ${key}:`, alumno.email);
          results.push({
            email: alumno.email,
            error: "Email inválido",
            status: "error",
          });
          continue;
        }

        // 🔑 Contraseña: firstName + lastName todo junto en minúsculas
        const firstName = alumno.firstName?.toLowerCase().replace(/\s+/g, "") || "";
        const lastName = alumno.lastName?.toLowerCase().replace(/\s+/g, "") || "";
        const finalPassword = `${firstName}${lastName}`;

        if (finalPassword.length < 6) {
          results.push({
            email,
            error: `Password demasiado corto: "${finalPassword}"`,
            status: "error",
          });
          continue;
        }

        try {
          let userRecord;
          let wasCreated = false;

          try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`✔ Ya existe en Auth: ${email}`);
          } catch (authError: any) {
            if (authError.code === "auth/user-not-found") {
              userRecord = await admin.auth().createUser({
                email,
                password: finalPassword,
                displayName: `${alumno.firstName} ${alumno.lastName}`.trim(),
              });
              wasCreated = true;
              console.log(`🆕 Creado en Auth: ${email}`);
            } else {
              throw authError;
            }
          }

          updates[key] = {
            ...alumno,
            email,
            uid: userRecord.uid,
            role: alumno.role || "alumno",
            passwordFinal: finalPassword,
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          needsUpdate = true;

          results.push({
            email,
            uid: userRecord.uid,
            password: finalPassword,
            wasCreated,
            status: "ok",
          });
        } catch (err: any) {
          console.error(`❌ Error procesando ${email}:`, err.message);
          results.push({
            email,
            error: err.message,
            code: err.code,
            status: "error",
          });
        }
      }

      if (needsUpdate && Object.keys(updates).length > 0) {
        await docSnap.ref.update(updates);
        console.log(`💾 Batch ${docSnap.id} actualizado`);
      } else {
        console.log(`zzz Batch ${docSnap.id} sin cambios`);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      skipped: results.filter((r) => r.status === "skipped").length,
      created: results.filter((r) => r.wasCreated).length,
      existing: results.filter((r) => r.status === "ok" && !r.wasCreated).length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    });
  } catch (err: any) {
    console.error("🔥 Error general:", err);
    return NextResponse.json(
      { ok: false, error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}