"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiSave, FiGlobe, FiFlag } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import SuccessModal from "@/components/ui/SuccessModal";

export default function AdminProfilePage() {
  const { user, userProfile, authReady, setUserProfile } = useAuth();
  const { setLang } = useI18n();

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

  // Guardar idioma anterior para detectar cambios
  const [previousLanguage, setPreviousLanguage] = useState("");

  /* ============================================================
     Cargar datos del perfil
  ============================================================ */
  useEffect(() => {
    if (!authReady) return;

    if (userProfile) {
      const language = userProfile.learningLanguage || userProfile.language || userProfile.idioma || "";
      
      setForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        dni: userProfile.dni || "",
        learningLanguage: language,
        learningLevel: userProfile.learningLevel || userProfile.nivel || "",
      });

      setPreviousLanguage(language);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [authReady, userProfile]);

  /* ============================================================
     Handler de cambios
  ============================================================ */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ============================================================
     Guardar perfil + actualizar contexto + cambiar idioma
  ============================================================ */
  const handleSave = async () => {
    if (!userProfile?.batchId || !userProfile?.userKey) {
      toast.error("Unable to identify user profile");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!form.learningLanguage || !form.learningLevel) {
      toast.error("Please select both language and level");
      return;
    }

    setSaving(true);

    try {
      const ref = doc(db, "alumnos", userProfile.batchId);

      // Datos normalizados
      const updatedData = {
        ...userProfile,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: form.dni.trim(),
        learningLanguage: form.learningLanguage,
        learningLevel: form.learningLevel.toUpperCase(),
        // Mantener compatibilidad con campos antiguos
        language: form.learningLanguage,
        idioma: form.learningLanguage,
        nivel: form.learningLevel.toUpperCase(),
      };

      // 1️⃣ Guardar en Firestore
      await setDoc(
        ref,
        {
          [userProfile.userKey]: updatedData,
        },
        { merge: true }
      );

      // 2️⃣ Actualizar contexto local (CRÍTICO)
      setUserProfile?.(updatedData);

      // 3️⃣ Si cambió el idioma → actualizar i18n
      const languageChanged = previousLanguage !== form.learningLanguage;
      
      if (languageChanged) {
        setLang(form.learningLanguage);
        setPreviousLanguage(form.learningLanguage);
        
        toast.success("Profile updated! Language changed successfully.", {
          description: "The interface will reflect your new language settings.",
        });
      } else {
        toast.success("Profile updated successfully!");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  /* ============================================================
     UI
  ============================================================ */
  return (
    <>
      <div className="min-h-screen bg-white p-8 space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#112C3E" }}>
              My Profile
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your personal information and learning preferences
            </p>
          </div>
        </div>

        {/* CARD: DATOS PERSONALES */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-[#112C3E]/10 rounded-lg">
              <FiUser className="text-[#112C3E]" size={20} />
            </div>
            <h2 className="font-semibold text-gray-900 text-lg">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              />
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ID Number
              </label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="Enter your ID number"
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
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
        </div>

        {/* CARD: LEARNING CONFIGURATION */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-[#112C3E]/10 rounded-lg">
              <FiGlobe className="text-[#112C3E]" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 text-lg">
                Learning Configuration
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select your learning language and proficiency level
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiGlobe size={16} className="text-blue-600" />
                Learning Language *
              </label>
              <select
                name="learningLanguage"
                value={form.learningLanguage}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              >
                <option value="" disabled>Select language...</option>
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="fr">French</option>
              </select>
            </div>

            {/* Learning Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiFlag size={16} className="text-green-600" />
                CEFR Level *
              </label>
              <select
                name="learningLevel"
                value={form.learningLevel}
                onChange={handleChange}
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
              >
                <option value="" disabled>Select level...</option>
                <option value="A1">A1 – Beginner</option>
                <option value="A2">A2 – Elementary</option>
                <option value="B1">B1 – Intermediate</option>
                <option value="B2">B2 – Upper Intermediate</option>
                <option value="B2.5">B2.5 – Advanced Intermediate</option>
                <option value="C1">C1 – Advanced</option>
                <option value="C2">C2 – Proficient</option>
              </select>
            </div>
          </div>

          
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            style={{ backgroundColor: "#EE7203" }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <SuccessModal open={showSuccess} message="Profile updated successfully!" />
    </>
  );
}