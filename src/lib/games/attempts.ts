// /lib/games/attempts.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchUserFromBatchesByUid } from "@/lib/userBatches";

const TODAY = () => new Date().toISOString().split("T")[0];

// 🔹 Devuelve true si el alumno ya jugó este juego hoy
export async function userPlayedToday(uid: string, game: string) {
  const profile = await fetchUserFromBatchesByUid(uid);
  if (!profile) return false;

  const batchRef = doc(db, "alumnos", profile.batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return false;

  const data: any = snap.data();
  const userKey = Object.keys(data).find(k => k.startsWith("user_") && data[k]?.uid === uid);
  if (!userKey) return false;

  const attempts = data[userKey]?.gamingAttempts || {};
  return attempts[game] === TODAY();
}

// 🔹 Marca como jugado hoy
export async function updateUserGameAttempt(uid: string, game: string) {
  const profile = await fetchUserFromBatchesByUid(uid);
  if (!profile) return;

  const batchRef = doc(db, "alumnos", profile.batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return;

  const data: any = snap.data();
  const userKey = Object.keys(data).find(k => k.startsWith("user_") && data[k]?.uid === uid);
  if (!userKey) return;

  const userData = data[userKey] || {};
  const attempts = userData.gamingAttempts || {};

  attempts[game] = TODAY();

  await setDoc(
    batchRef,
    { [userKey]: { ...userData, gamingAttempts: attempts } },
    { merge: true }
  );
}
