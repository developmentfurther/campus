"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { fetchUserFromBatchesByUid } from "@/lib/userBatches";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  role: "admin" | "profesor" | "alumno" | null;
  authReady: boolean;
  loading: boolean;
  loggingOut: boolean;
  userProfile: any | null;
  setUserProfile: (data: any) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  authReady: false,
  loading: true,
  loggingOut: false,
  userProfile: null,
  setUserProfile: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "profesor" | "alumno" | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const router = useRouter();
  const { setLang } = useI18n();

  const logout = async () => {
    try {
      setLoggingOut(true);
      Cookies.remove("admin_2fa_valid");
      Cookies.remove("user_role");
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
      toast.error("Error al cerrar sesión");
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          try {
            let p = await fetchUserFromBatchesByUid(firebaseUser.uid);

            // if (!p) {
            //   await addUserToBatch(firebaseUser, "alumno");
            //   p = await fetchUserFromBatchesByUid(firebaseUser.uid);
            // }

            if (p?.batchId) {
              const snap = await getDoc(doc(db, "alumnos", p.batchId));
              if (snap.exists()) {
                p = { ...p, ...(snap.data()[p.userKey] || {}) };
              }
            }

            const resolvedRole = p?.role || "alumno";
            const normalizedProfile = {
  ...p,
  learningLanguages: p?.learningLanguages?.length
    ? p.learningLanguages
    : p?.learningLanguage
      ? [p.learningLanguage]
      : ["en"],
  activeLanguage: p?.activeLanguage || p?.learningLanguage || "en",
  learningLevel: p?.learningLevel || "A1",  // ✅ default
  firstName: p?.firstName || "",
  lastName: p?.lastName || "",
};

setRole(resolvedRole);
setUserProfile(normalizedProfile);
setLang(resolvedRole === "profesor" ? "en" : normalizedProfile.activeLanguage);

          } catch (err) {
            console.error("❌ Error cargando perfil:", err);
          } finally {
            // ✅ Solo se libera cuando el perfil está completamente cargado
            setAuthReady(true);
            setLoading(false);
          }

        } else {
          setUser(null);
          setRole(null);
          setUserProfile(null);
          setAuthReady(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Error Auth:", err);
        setLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, authReady, loading, loggingOut, userProfile, setUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);