"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiSave, FiGlobe, FiFlag, FiFileText } from "react-icons/fi";
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
  const [saving, setSaving] = useState(false);

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
  // Handler para input
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ============================================================
  // Guardar datos personales
  // ============================================================
  const handleSave = async () => {
    if (!userProfile?.batchId || !userProfile?.userKey)
      return toast.error("No se pudo identificar al alumno.");

    setSaving(true);

    try {
      const ref = doc(db, "alumnos", userProfile.batchId);

      await setDoc(
        ref,
        {
          [userProfile.userKey]: {
            ...userProfile,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            dni: form.dni.trim(),
          },
        },
        { merge: true }
      );

      setUserProfile((prev: any) => ({
        ...prev,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: form.dni.trim(),
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {t("profile.loading")}
      </div>
    );
  }

  // ============================================================
  // UI REDISEÑADA — IGUAL A PROFESOR
  // ============================================================
  return (
    <>
      <div className="min-h-screen bg-white p-8 space-y-10">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "#112C3E" }}
            >
              {t("profile.title")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("profile.subtitle")}
            </p>
          </div>
        </div>

        {/* ======================= DATOS PERSONALES ======================= */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-[#112C3E]/10 rounded-lg">
              <FiUser className="text-[#112C3E]" size={20} />
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {t("profile.personalHeader")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.placeholderFirstName")}
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.placeholderLastName")}
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              />
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.placeholderDni")}
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 p-3 pl-10 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email readonly */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.emailLabel")}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full border-2 border-gray-200 p-3 pl-10 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Guardar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
              style={{ backgroundColor: "#EE7203" }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("profile.saving")}
                </>
              ) : (
                <>
                  <FiSave />
                  {t("profile.saveButton")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ======================= IDIOMA / NIVEL SOLO LECTURA ======================= */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-[#112C3E]/10 rounded-lg">
              <FiGlobe className="text-[#112C3E]" size={20} />
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {t("profile.learningHeader")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Idioma */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.languageLabel")}
              </label>
              <select
                disabled
                value={form.learningLanguage}
                className="w-full border-2 border-gray-200 p-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="fr">French</option>
              </select>
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("profile.levelLabel")}
              </label>
              <select
  disabled
  value={form.learningLevel}
  className="w-full border-2 border-gray-200 p-3 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
>
  <option value="A1">A1 – Beginner</option>
  <option value="A2">A2 – Elementary</option>
  <option value="B1">B1 – Intermediate</option>
  <option value="B2">B2 – Upper Intermediate</option>
  <option value="B2.5">B2.5 – Pre-Advanced</option>
  <option value="C1">C1 – Advanced</option>
  <option value="C2">C2 – Proficient</option>
</select>

            </div>
          </div>
        </div>
      </div>

      <SuccessModal open={showSuccess} message={t("profile.updatedSuccess")} />
    </>
  );
}
