"use client";

import { useState, useEffect } from "react";
import { FiMail, FiUser, FiEdit2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SuccessModal from "@/components/ui/SuccessModal";

export default function AdminProfilePage() {
  const { user, userProfile, authReady } = useAuth();

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    learningLanguage: "",
    learningLevel: "",
  });

  // ================================
  // LOAD DATA (idéntico a alumno)
  // ================================
  useEffect(() => {
    if (!authReady) return;

    // Si el contexto ya tiene el perfil → usarlo
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

    // Si NO tiene → buscar en Firestore
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


  // ================================
  // HANDLE INPUT
  // ================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  // ================================
  // SAVE PROFILE (idéntico a alumno,
  // solo sin i18n)
  // ================================
  const handleSave = async () => {
    if (!userProfile?.batchId || !userProfile?.userKey)
      return toast.error("No se pudo identificar el usuario.");

    try {
      const ref = doc(db, "alumnos", userProfile.batchId);

      await setDoc(
        ref,
        {
          [userProfile.userKey]: {
            ...userProfile,
            ...form,
          },
        },
        { merge: true }
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios");
    }
  };


  if (!authReady || loading)
    return <div className="p-8 text-gray-500">Cargando perfil…</div>;


  // ================================
  // UI
  // ================================
  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Mi Perfil</h1>
          <Button
            onClick={handleSave}
            className="bg-blue-600 text-white flex items-center gap-2"
          >
            <FiEdit2 /> Guardar cambios
          </Button>
        </div>

        {/* CARD DATOS PERSONALES */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <FiUser /> Datos personales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Nombre"
              className="border p-2 rounded"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Apellido"
              className="border p-2 rounded"
            />
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              placeholder="DNI"
              className="border p-2 rounded"
            />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiMail className="text-gray-500" />
              {user?.email}
            </div>
          </div>
        </div>

        {/* CARD APRENDIZAJE */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Configuración de aprendizaje</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Idioma */}
            <div>
              <label className="text-sm text-gray-600">Idioma que estudiás</label>
              <select
                name="learningLanguage"
                value={form.learningLanguage}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option value="" disabled hidden>Seleccionar…</option>
                <option value="en">English</option>
                <option value="pt">Portuguese</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
                <option value="fr">French</option>
              </select>
            </div>

            {/* Nivel */}
            <div>
              <label className="text-sm text-gray-600">Nivel CEFR</label>
              <select
                name="learningLevel"
                value={form.learningLevel}
                onChange={handleChange}
                className="w-full border p-2 rounded mt-1"
              >
                <option value="" disabled hidden>Seleccionar…</option>
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

      <SuccessModal open={showSuccess} message="Perfil actualizado correctamente" />
    </>
  );
}
