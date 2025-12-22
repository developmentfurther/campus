'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { validateUserStatus } from '@/lib/userValidation';
import { doc, getDoc } from 'firebase/firestore';
import { FiMail, FiLock, FiArrowRight, FiZap, FiAlertCircle } from "react-icons/fi";
import LoaderUi from '@/components/ui/LoaderUi';
import FancyBackground from '@/components/ui/FancyBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, authReady, loggingOut } = useAuth();
  const router = useRouter();

  // Redirección si ya está logueado
  useEffect(() => {
    if (authReady && user) {
      router.replace('/dashboard');
    }
  }, [authReady, user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // =====================================
      // 📝 REGISTRO DE NUEVA CUENTA
      // =====================================
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Cuenta creada exitosamente. Ahora podés iniciar sesión.");
        setIsRegister(false);
        setEmail('');
        setPassword('');
        setLoading(false);
        return;
      }

      // =====================================
      // 🔥 PASO 1: VALIDAR ESTADO ANTES DE LOGIN
      // =====================================
      console.log("🔍 Validando estado del usuario:", email);
      const validation = await validateUserStatus(email);

      if (!validation.exists) {
        setError("Este correo no está registrado en Further Campus. Contactá a coordinacionacademica@furtherenglish.com");
        setLoading(false);
        return;
      }

      if (!validation.isActive) {
        setShowBajaModal(true);
        setLoading(false);
        return;
      }

      // =====================================
      // ✅ PASO 2: LOGIN EXITOSO
      // =====================================
      console.log("✅ Usuario válido, procediendo con login...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 🔥 VERIFICAR SI ES ADMIN Y NECESITA 2FA
      const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      const isAdmin = userDoc.exists() && userDoc.data()?.role === 'admin';

      if (isAdmin) {
        console.log("🔐 Usuario admin detectado, redirigiendo a 2FA...");
        // El middleware interceptará y redirigirá a /2fa si no tiene cookie
        router.push('/dashboard');
      } else {
        console.log("✅ Usuario regular, acceso directo al dashboard");
        router.push('/dashboard');
      }

    } catch (err: any) {
      console.error("❌ Error en autenticación:", err);
      
      if (err.code === "auth/user-not-found") {
        setError("No existe una cuenta con este correo.");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intentá más tarde.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo es inválido.");
      } else {
        setError("Error al iniciar sesión. Intentá nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0C212D] font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (loggingOut) return <LoaderUi />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 relative overflow-hidden">
      <FancyBackground />

      {/* 🔥 MODAL USUARIO DADO DE BAJA */}
      {showBajaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-red-600 text-3xl" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
              Acceso Denegado
            </h2>

            <div className="space-y-4 mb-6">
              <p className="text-gray-700 text-center leading-relaxed">
                Tu cuenta está marcada como{' '}
                <span className="font-bold text-red-600">dada de baja</span> y no podés
                acceder al Campus en este momento.
              </p>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="text-gray-700 text-sm font-semibold mb-2">
                  ¿Querés reactivar tu cuenta?
                </p>
                <p className="text-gray-600 text-sm mb-3">
                  Enviá un correo a:
                </p>
                <a 
                  href="mailto:soporte@furthercampus.com"
                  className="text-orange-600 font-bold hover:text-orange-700 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  soporte@furthercampus.com
                  <FiArrowRight />
                </a>
              </div>
            </div>

            <button
              onClick={() => {
                setShowBajaModal(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#0C212D] to-[#112C3E] opacity-5 rounded-full blur-3xl translate-x-64 translate-y-64"></div>

      {/* Formulario de login */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* HEADER */}
          <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-20 rounded-full blur-2xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FF3816] opacity-10 rounded-full blur-2xl -ml-16 -mb-16"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#FF3816] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>

              <h1 className="text-3xl font-black text-center mb-2 tracking-tight">
                Further Campus
              </h1>

              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#EE7203] to-transparent"></div>
                <FiZap className="text-[#EE7203]" size={16} />
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#FF3816] to-transparent"></div>
              </div>

              <p className="text-gray-300 text-sm text-center font-medium">
                {isRegister ? "Crea tu cuenta" : "Inicia sesión para continuar"}
              </p>
            </div>
          </div>

          {/* FORM */}
          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-[#0C212D] mb-2">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors">
                    <FiMail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium
                      focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                      hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-[#0C212D] mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors">
                    <FiLock size={20} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium
                      focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                      hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
                  <FiAlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-sm leading-relaxed">{error}</span>
                </div>
              )}

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg overflow-hidden ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] hover:shadow-xl hover:scale-[1.02] active:scale-95"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isRegister ? "Creando cuenta..." : "Validando..."}
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isRegister ? "Crear cuenta" : "Iniciar sesión"}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                disabled={loading}
                className="group inline-flex items-center gap-2 text-[#0C212D] hover:text-[#EE7203] text-sm font-bold transition-colors disabled:opacity-50"
              >
                <span className="relative">
                  {isRegister ? "Ya tengo cuenta" : "Crear cuenta nueva"}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] group-hover:w-full transition-all duration-300"></span>
                </span>
                <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
                <div className="w-1 h-1 bg-[#FF3816] rounded-full"></div>
                <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                © {new Date().getFullYear()} Further Campus
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}