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

// ========================================
// 🧼 NORMALIZADOR DE EMAILS
// ========================================
function normalizeEmail(raw: string | undefined | null) {
  if (!raw) return null;

  let email = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .split(/[;,/]+/)[0]; // toma el primer email válido

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return valid ? email : null;
}

export async function POST() {
  try {
    const db = admin.firestore();
    const snaps = await db.collection("alumnos_raw").get();
    const results: any[] = [];

    console.log("📌 Docs encontrados en alumnos_raw:", snaps.size);

    for (const docSnap of snaps.docs) {
      const data = docSnap.data();
      const updates: any = {};

      for (const key in data) {
        if (!key.startsWith("user_")) continue;

        const alumno = data[key];

        // ===========================
        // 🧼 Normalizar Email
        // ===========================
        const email = normalizeEmail(alumno.email);

        if (!email) {
          console.warn(`❌ Email inválido en ${key}:`, alumno.email);
          results.push({
            email: alumno.email,
            error: "Email inválido (no se procesó)",
            status: "error",
          });
          continue;
        }

        // ===========================
        // Construir password
        // ===========================
        const basePassword = alumno.password?.toLowerCase()?.replace(/\s+/g, "") || "";
        const firstCourse = alumno.cursosAsignados?.[0]?.curso?.toLowerCase() || "";
        const finalPassword = `${basePassword}${firstCourse}`;

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
            console.log(`✔ Usuario ya existe: ${email}`);
          } catch (authError: any) {
            if (authError.code === "auth/user-not-found") {
              userRecord = await admin.auth().createUser({
                email,
                password: finalPassword,
                displayName: alumno.nombre || "",
              });
              wasCreated = true;
              console.log(`🆕 Usuario creado: ${email}`);
            } else {
              throw authError;
            }
          }

          updates[key] = {
            ...alumno,
            email, // email corregido
            uid: userRecord.uid,
            role: alumno.role || "alumno",
            passwordFinal: finalPassword,
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

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

      if (Object.keys(updates).length > 0) {
        await docSnap.ref.update(updates);
        console.log(
          `💾 Documento ${docSnap.id} actualizado con ${Object.keys(updates).length} alumnos`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
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
