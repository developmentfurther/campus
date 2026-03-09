"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiSave, FiGlobe, FiFlag, FiFileText } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import SuccessModal from "@/components/ui/SuccessModal";

export default function ProfesorPerfil() {
  const { user, userProfile, authReady, setUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
  });

  // Mapeo de idiomas para mostrar nombres legibles
  const idiomaDisplayMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
    english: "English",
    ingles: "English",
    inglés: "English",
    spanish: "Spanish",
    espanol: "Spanish",
    español: "Spanish",
    portuguese: "Portuguese",
    portugues: "Portuguese",
    português: "Portuguese",
    french: "French",
    frances: "French",
    francés: "French",
    italian: "Italian",
    italiano: "Italian",
  };

  /* ============================================================
     Cargar datos del profesor
  ============================================================ */
  useEffect(() => {
    if (!authReady) return;

    if (!userProfile?.batchId || !userProfile?.userKey) {
      setLoading(false);
      return;
    }

    setForm({
      firstName: userProfile.firstName || "",
      lastName: userProfile.lastName || "",
      dni: userProfile.dni || "",
    });

    setLoading(false);
  }, [authReady, userProfile]);

  /* ============================================================
     Handler cambios
  ============================================================ */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ============================================================
     Guardar datos personales (solo nombre y DNI)
  ============================================================ */
  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!userProfile?.batchId || !userProfile?.userKey) {
      toast.error("Unable to identify teacher profile");
      return;
    }

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

      // Actualizar el contexto local
      setUserProfile?.({
        ...userProfile,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dni: form.dni.trim(),
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Error saving profile");
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

  const idiomasProfesor = Array.isArray(userProfile?.idiomasProfesor)
    ? userProfile.idiomasProfesor
    : [];

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
              Profile Settings
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your personal information and teaching credentials
            </p>
          </div>
        </div>

        {/* EDITABLE: DATOS PERSONALES */}
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
              <div className="relative">
                <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="Enter your ID number"
                  className="w-full border-2 border-gray-200 p-3 pl-10 rounded-lg focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 outline-none transition-all"
                />
              </div>
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

          {/* Save Button */}
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

        {/* READ-ONLY: TEACHING LANGUAGES */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-[#112C3E]/10 rounded-lg">
              <FiGlobe className="text-[#112C3E]" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 text-lg">
                Teaching Languages
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Your assigned teaching languages and levels (managed by admin)
              </p>
            </div>
          </div>

          {idiomasProfesor.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiGlobe size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No languages assigned yet</p>
              <p className="text-sm mt-1">Contact your administrator to assign teaching languages</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {idiomasProfesor.map((item, index) => {
                const displayName =
                  idiomaDisplayMap[item.idioma?.toLowerCase()] ||
                  item.idioma?.charAt(0).toUpperCase() + item.idioma?.slice(1).toLowerCase();

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiGlobe className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500">Language</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                      <FiFlag className="text-green-600" size={16} />
                      <span className="font-bold text-green-700">
                        {item.nivel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <SuccessModal open={showSuccess} message="Profile updated successfully!" />
    </>
  );
}