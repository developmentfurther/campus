"use client";

import { useState, useEffect } from "react";
import ProfileTutorial from "@/components/tutoriales/ProfileTutorial";
import { FiMail, FiUser, FiSave, FiGlobe, FiFileText, FiHelpCircle } from "react-icons/fi";
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

  const [tutorialKey, setTutorialKey] = useState(0);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    learningLanguage: "",
    learningLevel: "",
  });

  // ============================================================
  // Cargar datos
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
  // Handlers
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
  // UI FIX: Padding corregido en inputs con icono
  // ============================================================
  return (
    <>
      <ProfileTutorial key={tutorialKey} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 space-y-6 md:space-y-8">
        
        {/* HEADER */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl md:rounded-3xl opacity-5"></div>
          <div className="relative p-5 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100">
            
            <button 
                onClick={() => setTutorialKey(prev => prev + 1)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white border border-gray-200 text-gray-400 hover:text-[#EE7203] hover:border-[#EE7203] rounded-full transition-all shadow-sm z-20 hover:scale-110"
                title="Ayuda / Tutorial"
            >
                <FiHelpCircle size={20} className="md:w-[22px] md:h-[22px]" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-start gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg flex-shrink-0">
                <FiUser className="text-white w-7 h-7 md:w-8 md:h-8" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-[#0C212D] to-[#112C3E] bg-clip-text text-transparent">
                  {t("profile.title")}
                </h1>
                <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-lg leading-relaxed">
                  {t("profile.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* GRID DE SECCIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* DATOS PERSONALES */}
          <div className="lg:col-span-2" data-tutorial="profile-personal-card">
            <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              
              {/* Header Card */}
              <div className="relative p-5 md:p-6 border-b border-gray-100">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#EE7203] to-[#FF3816]"></div>
                <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#0C212D]/10 to-[#112C3E]/10 flex items-center justify-center flex-shrink-0">
                    <FiUser className="text-[#0C212D] w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg md:text-xl text-[#0C212D]">
                      {t("profile.personalHeader")}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500">
                      Información básica de tu cuenta
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido Card */}
              <div className="p-5 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderFirstName")}
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      // 🛠 FIX: Usamos py-3 pr-4 pl-12 (sin usar 'p-' shorthand) para evitar conflictos con md:p-4
                      className="w-full border-2 border-gray-200 py-3 pr-4 md:py-4 pl-4 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium text-sm md:text-base"
                    />
                  </div>

                  {/* Apellido */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderLastName")}
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 py-3 pr-4 md:py-4 pl-4 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium text-sm md:text-base"
                    />
                  </div>

                  {/* DNI */}
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.placeholderDni")}
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        name="dni"
                        value={form.dni}
                        onChange={handleChange}
                        // 🛠 FIX: 'pl-12' asegurado en todos los breakpoints
                        className="w-full border-2 border-gray-200 py-3 pr-4 md:py-4 pl-12 rounded-xl focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all text-gray-700 font-medium text-sm md:text-base"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2" data-tutorial="profile-email-container">
                    <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                      {t("profile.emailLabel")}
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        value={user?.email || ""}
                        disabled
                        // 🛠 FIX: Padding Left 12 fijo, evitando que md:p-4 lo pise
                        className="w-full border-2 border-gray-200 py-3 pr-4 md:py-4 pl-12 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="flex justify-end pt-2 md:pt-4">
                  <Button
                    data-tutorial="profile-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto px-8 py-6 md:py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white rounded-xl font-bold flex justify-center items-center gap-3 transition-all hover:shadow-lg hover:scale-[1.02] md:hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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

          {/* ACADEMIC INFO */}
          <div className="lg:col-span-1" data-tutorial="profile-academic-card">
            <div className="bg-white rounded-2xl md:rounded-3xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full">
              
              <div className="relative p-5 md:p-6 border-b border-gray-100">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#0C212D] to-[#112C3E]"></div>
                <div className="flex items-center gap-3 md:gap-4 pl-3 md:pl-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/10 flex items-center justify-center flex-shrink-0">
                    <FiGlobe className="text-[#EE7203] w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg md:text-xl text-[#0C212D]">
                      {t("profile.learningHeader")}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500">
                      Read only
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                    {t("profile.languageLabel")}
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={form.learningLanguage}
                      className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed font-medium appearance-none text-sm md:text-base"
                    >
                      <option value="en">English</option>
                      <option value="pt">Portuguese</option>
                      <option value="es">Spanish</option>
                      <option value="it">Italian</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-semibold text-[#0C212D] uppercase tracking-wide">
                    {t("profile.levelLabel")}
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={form.learningLevel}
                      className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 cursor-not-allowed font-medium appearance-none text-sm md:text-base"
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

                <div className="mt-4 md:mt-6 p-4 rounded-xl bg-gradient-to-r from-[#0C212D]/5 to-[#112C3E]/5 border-l-4 border-[#EE7203]">
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
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