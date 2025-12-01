'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiArrowRight, FiZap } from "react-icons/fi";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && user) {
      router.replace('/dashboard');
    }
  }, [authReady, user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Cuenta creada exitosamente. Ahora iniciá sesión.');
        setIsRegister(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      setError('Credenciales incorrectas o error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleAuth(e);
  };

  if (!authReady)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0C212D] font-bold">Cargando autenticación...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#0C212D] to-[#112C3E] opacity-5 rounded-full blur-3xl translate-x-64 translate-y-64"></div>
      
      {/* Patrón de puntos */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #0C212D 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          
          {/* Header con gradiente */}
          <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-8 text-white overflow-hidden">
            
            {/* Elementos decorativos del header */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-20 rounded-full blur-2xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FF3816] opacity-10 rounded-full blur-2xl -ml-16 -mb-16"></div>
            
            <div className="relative z-10">
              {/* Logo con animación */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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
                {isRegister ? "Crea tu cuenta y comienza" : "Inicia sesión para continuar"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="space-y-5">
              
              {/* Email Input */}
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
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium
                      focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                      hover:border-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium
                      focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                      hover:border-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-4">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`group relative w-full py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg overflow-hidden ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] hover:shadow-xl hover:scale-[1.02] active:scale-95"
                }`}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:left-full transition-all duration-1000"></div>
                </div>
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      {isRegister ? "Crear cuenta" : "Iniciar Sesión"}
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Switch login/register */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="group inline-flex items-center gap-2 text-[#0C212D] hover:text-[#EE7203] text-sm font-bold transition-colors"
              >
                <span className="relative">
                  {isRegister ? "Ya tengo una cuenta" : "Crear cuenta nueva"}
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
              <p className="text-xs text-gray-400 mt-1">
                Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>

        {/* Texto decorativo inferior */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Plataforma de aprendizaje corporativo
          </p>
        </div>
      </div>
    </div>
  );
}