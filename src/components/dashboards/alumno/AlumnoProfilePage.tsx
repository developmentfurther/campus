"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiSave, FiGlobe, FiFileText } from "react-icons/fi";
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
  // UI REDISEÑADA
  // ============================================================
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 space-y-8">
        {/* HEADER con degradado sutil */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-3xl opacity-5"></div>
          <div className="relative p-8 rounded-3xl border border-gray-100">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
                <FiUser className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#0C212D] to-[#112C3E] bg-clip-text text-transparent">
                  {t("profile.title")}
                </h1>
                <p className="text-gray-500 mt-2 text-lg">
                  {t("profile.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID DE SECCIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DATOS PERSONALES - 2 columnas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              {/* Header con borde de color */}
              <div className="relative p-6 border-b border-gray-100">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#EE7203] to-[#FF3816]"></div>
                <div className="flex items-center gap-4 pl-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C212D]/10 to-[#112C3E]/10 flex items-center justify-center">
                    <FiUser className="text-[#0C212D]" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-[#0C212D]">
                      {t("profile.personalHeader")}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Información básica de tu cuenta
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderFirstName")}
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium"
                    />
                  </div>

                  {/* Apellido */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderLastName")}
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium"
                    />
                  </div>

                  {/* DNI */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderDni")}
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        name="dni"
                        value={form.dni}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 p-4 pl-12 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Email readonly */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.emailLabel")}
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        value={user?.email || ""}
                        disabled
                        className="w-full border-2 border-gray-200 p-4 pl-12 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white rounded-xl font-bold flex items-center gap-3 transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("profile.saving")}
                      </>
                    ) : (
                      <>
                        <FiSave size={20} />
                        {t("profile.saveButton")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* IDIOMA Y NIVEL - 1 columna */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
              {/* Header con borde de color */}
              <div className="relative p-6 border-b border-gray-100">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#0C212D] to-[#112C3E]"></div>
                <div className="flex items-center gap-4 pl-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/10 flex items-center justify-center">
                    <FiGlobe className="text-[#EE7203]" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-[#0C212D]">
                      {t("profile.learningHeader")}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Read only
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-8 space-y-6">
                {/* Idioma */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                    {t("profile.languageLabel")}
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={form.learningLanguage}
                      className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed font-medium appearance-none"
                    >
                      <option value="en">English</option>
                      <option value="pt">Portuguese</option>
                      <option value="es">Spanish</option>
                      <option value="it">Italian</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>

                {/* Nivel con diseño especial */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                    {t("profile.levelLabel")}
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={form.learningLevel}
                      className="w-full border-2 border-gray-200 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed font-medium appearance-none"
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

                {/* Badge informativo */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#0C212D]/5 to-[#112C3E]/5 border-l-4 border-[#EE7203]">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold text-[#0C212D]">💡 Note:</span> Your language and level are assigned by your institution. Contact your teacher to change them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal open={showSuccess} message={t("profile.updatedSuccess")} />
    </>
  );
}