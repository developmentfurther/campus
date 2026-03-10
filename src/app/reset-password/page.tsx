'use client';

import { useState, useEffect, Suspense } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { FiLock, FiArrowRight, FiZap, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import FancyBackground from '@/components/ui/FancyBackground';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidCode, setInvalidCode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setInvalidCode(true);
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setVerifying(false);
      })
      .catch(() => {
        setInvalidCode(true);
        setVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode!, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/expired-action-code') {
        setError('El link expiró. Solicitá uno nuevo desde el login.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('El link es inválido o ya fue usado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil.');
      } else {
        setError('Error al restablecer la contraseña. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0C212D] font-bold">Verificando link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 relative overflow-hidden">
      <FancyBackground />

      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-[#0C212D] to-[#112C3E] opacity-5 rounded-full blur-3xl translate-x-64 translate-y-64"></div>

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
              <h1 className="text-3xl font-black text-center mb-2 tracking-tight">Further Campus</h1>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#EE7203] to-transparent"></div>
                <FiZap className="text-[#EE7203]" size={16} />
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#FF3816] to-transparent"></div>
              </div>
              <p className="text-gray-300 text-sm text-center font-medium">
                {invalidCode ? "Link inválido" : success ? "¡Listo!" : "Creá tu nueva contraseña"}
              </p>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">

            {/* LINK INVÁLIDO */}
            {invalidCode && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="text-red-600 text-3xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Link inválido o expirado</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Este link ya fue usado o expiró. Solicitá uno nuevo desde el login.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold"
                >
                  Volver al login
                </button>
              </div>
            )}

            {/* ÉXITO */}
            {success && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="text-green-600 text-3xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">¡Contraseña actualizada!</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="group w-full py-3 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold hover:shadow-lg transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ir al login
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            )}

            {/* FORMULARIO */}
            {!invalidCode && !success && (
              <>
                <p className="text-gray-500 text-sm text-center mb-6">
                  Restableciendo contraseña para <span className="font-bold text-[#0C212D]">{email}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-sm font-bold text-[#0C212D] mb-2">Nueva contraseña</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors">
                        <FiLock size={20} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all hover:border-gray-300 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#EE7203] transition-colors"
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-sm font-bold text-[#0C212D] mb-2">Confirmar contraseña</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors">
                        <FiLock size={20} />
                      </div>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all hover:border-gray-300 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#EE7203] transition-colors"
                      >
                        {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3">
                      <FiAlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-sm leading-relaxed">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`group w-full py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg ${
                      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:shadow-xl hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3 justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Guardar nueva contraseña
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push('/login')}
                    className="text-sm text-gray-400 hover:text-[#EE7203] font-semibold transition-colors"
                  >
                    Volver al login
                  </button>
                </div>
              </>
            )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
