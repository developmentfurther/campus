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
    const snaps = await db.collection("alumnos_raw").get();
    const results: any[] = [];
    
    console.log("📌 Docs encontrados en alumnos_raw:", snaps.size);

    // Procesar cada documento
    for (const docSnap of snaps.docs) {
      const data = docSnap.data();
      const updates: any = {};

      // Procesar cada campo que empiece con "user_"
      for (const key in data) {
        if (!key.startsWith("user_")) continue;

        const alumno = data[key];
        const email = alumno.email?.toLowerCase()?.trim();
        
        if (!email) {
          console.warn(`⚠️ Campo ${key} sin email válido`);
          continue;
        }

        // Construir password
        const basePassword = alumno.password?.toLowerCase()?.replace(/\s+/g, "") || "";
        const firstCourse = alumno.cursosAsignados?.[0]?.curso?.toLowerCase() || "";
        const finalPassword = `${basePassword}${firstCourse}`;

        // Validar que el password tenga al menos 6 caracteres
        if (finalPassword.length < 6) {
          console.error(`❌ Password demasiado corto para ${email}: "${finalPassword}"`);
          results.push({
            email,
            error: "Password debe tener al menos 6 caracteres",
            status: "error",
          });
          continue;
        }

        try {
          let userRecord;
          let wasCreated = false;

          // Intentar obtener el usuario existente
          try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`✅ Usuario ya existe: ${email}`);
          } catch (authError: any) {
            // Si no existe, crearlo
            if (authError.code === 'auth/user-not-found') {
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

          // Preparar actualización para este campo
          updates[key] = {
            ...alumno,
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

      // Actualizar el documento con todos los cambios
      if (Object.keys(updates).length > 0) {
        await docSnap.ref.update(updates);
        console.log(`💾 Documento ${docSnap.id} actualizado con ${Object.keys(updates).length} alumnos`);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      created: results.filter(r => r.wasCreated).length,
      existing: results.filter(r => r.status === 'ok' && !r.wasCreated).length,
      errors: results.filter(r => r.status === 'error').length,
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