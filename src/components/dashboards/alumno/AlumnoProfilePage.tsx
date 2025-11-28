"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiEdit2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SuccessModal from "@/components/ui/SuccessModal";
import { useI18n } from "@/contexts/I18nContext";

export default function AlumnoProfilePage() {
  const { user, userProfile, authReady, setUserProfile } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    learningLanguage: "",
    learningLevel: "",
  });

  // ============================================================
  // Cargar datos del alumno
  // ============================================================
  useEffect(() => {
    if (!authReady) return;

    if (userProfile?.firstName || userProfile?.learningLanguage) {
      setForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        dni: userProfile.dni || "",
        learningLanguage: userProfile.learningLanguage || "",
        learningLevel: userProfile.learningLevel || "",
      });
      setLoading(false);
      return;
    }

    async function load() {
      if (!userProfile?.batchId || !userProfile?.userKey) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "alumnos", userProfile.batchId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const alumno = snap.data()[userProfile.userKey] || {};
          setForm({
            firstName: alumno.firstName || "",
            lastName: alumno.lastName || "",
            dni: alumno.dni || "",
            learningLanguage: alumno.learningLanguage || "",
            learningLevel: alumno.learningLevel || "",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authReady, userProfile]);

  // ============================================================
  // Handler para campos editables
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ============================================================
  // Guardar SOLO datos personales
  // (NO idioma / NO nivel → admin-only)
  // ============================================================
  const handleSave = async () => {
    if (!userProfile?.batchId || !userProfile?.userKey)
      return toast.error("No se pudo identificar al alumno.");

    try {
      const ref = doc(db, "alumnos", userProfile.batchId);

      await setDoc(
        ref,
        {
          [userProfile.userKey]: {
            ...userProfile,
            firstName: form.firstName,
            lastName: form.lastName,
            dni: form.dni,
          },
        },
        { merge: true }
      );

      // Update local memory
      setUserProfile((prev: any) => ({
        ...prev,
        firstName: form.firstName,
        lastName: form.lastName,
        dni: form.dni,
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el perfil");
    }
  };

  if (!authReady || loading)
    return <div className="p-8 text-gray-500">Cargando perfil…</div>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">{t("profile.title")}</h1>
          
        </div>

        {/* DATOS PERSONALES */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <FiUser /> {t("profile.personalHeader")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder={t("profile.placeholderFirstName")}
              className="border p-2 rounded"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder={t("profile.placeholderLastName")}
              className="border p-2 rounded"
            />
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              placeholder={t("profile.placeholderDni")}
              className="border p-2 rounded"
            />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiMail className="text-gray-500" />
              {user?.email}
            </div>
          </div>
        </div>

        {/* APRENDIZAJE — SOLO VISUAL, NO EDITABLE */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">{t("profile.learningHeader")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Idioma — disabled */}
            <div>
              <label className="text-sm text-gray-600">{t("profile.languageLabel")}</label>
              <select
                name="learningLanguage"
                value={form.learningLanguage}
                disabled
                className="w-full border p-2 rounded mt-1 bg-gray-100 text-gray-500"
              >
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="fr">French</option>
              </select>
            </div>

            {/* Nivel — disabled */}
            <div>
              <label className="text-sm text-gray-600">{t("profile.levelLabel")}</label>
              <select
                name="learningLevel"
                value={form.learningLevel}
                disabled
                className="w-full border p-2 rounded mt-1 bg-gray-100 text-gray-500"
              >
                <option value="A1">A1 – Beginner</option>
                <option value="A2">A2 – Elementary</option>
                <option value="B1">B1 – Intermediate</option>
                <option value="B2">B2 – Upper Intermediate</option>
                <option value="C1">C1 – Advanced</option>
                <option value="C2">C2 – Proficient</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      <SuccessModal open={showSuccess} message={t("profile.updatedSuccess")} />
    </>
  );
}
