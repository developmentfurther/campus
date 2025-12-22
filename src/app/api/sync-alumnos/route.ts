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
    .split(/[;,/]+/)[0];

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return valid ? email : null;
}

export async function POST() {
  try {
    const db = admin.firestore();
    // Nota: Si esto crece mucho, considera usar paginación, pero para "cientos" está bien.
    const snaps = await db.collection("alumnos_raw").get();
    const results: any[] = [];

    console.log("📌 Docs encontrados en alumnos_raw:", snaps.size);

    for (const docSnap of snaps.docs) {
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false; // Flag para saber si tocamos este documento

      for (const key in data) {
        if (!key.startsWith("user_")) continue;

        const alumno = data[key];

        // =====================================================================
        // 🔥 OPTIMIZACIÓN DE COSTOS Y VELOCIDAD
        // Si el alumno ya tiene UID, ya fue procesado antes. Lo saltamos.
        // =====================================================================
        if (alumno.uid) {
          // (Opcional) Log para ver qué está pasando, puedes comentarlo para menos ruido
          // console.log(`⏩ Saltando ${alumno.email || 'user'} (Ya sincronizado)`);
          
          results.push({
            email: alumno.email,
            uid: alumno.uid,
            status: "skipped", // Marcamos como saltado para el reporte
            wasCreated: false,
          });
          continue; // 🚀 ESTO ES LA CLAVE: Pasa al siguiente user_X sin hacer nada más
        }

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
            // Esto NO consume lecturas de Firestore (es API de Identity)
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`✔ Usuario ya existe en Auth: ${email}`);
          } catch (authError: any) {
            if (authError.code === "auth/user-not-found") {
              userRecord = await admin.auth().createUser({
                email,
                password: finalPassword,
                displayName: alumno.nombre || "",
              });
              wasCreated = true;
              console.log(`🆕 Usuario creado en Auth: ${email}`);
            } else {
              throw authError;
            }
          }

          // Preparamos la actualización para Firestore
          updates[key] = {
            ...alumno,
            email,
            uid: userRecord.uid, // 👈 Aquí vinculamos
            role: alumno.role || "alumno",
            passwordFinal: finalPassword,
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          
          needsUpdate = true; // Marcamos que este documento batch necesita guardarse

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

      // 💾 ESCRITURA: Solo escribimos en la DB si hubo cambios reales en este Batch
      if (needsUpdate && Object.keys(updates).length > 0) {
        await docSnap.ref.update(updates);
        console.log(
          `💾 Batch ${docSnap.id} actualizado con cambios.`
        );
      } else {
        console.log(`zzz Batch ${docSnap.id} sin cambios (todos ya estaban sincronizados).`);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      skipped: results.filter((r) => r.status === "skipped").length, // Nueva métrica
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