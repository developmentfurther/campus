"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { toast } from "sonner";
import { FiCheck, FiShield, FiLogOut } from "react-icons/fi";

export default function TwoFactorPage() {
  const { user, role, loading, logout } = useAuth(); // 🔥 Añadimos signOut
  const router = useRouter();

  const [step, setStep] = useState<"loading" | "setup" | "verify">("loading");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  const hasVerified = useRef(false);
  const isRedirecting = useRef(false);

  // Función para logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada correctamente");
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  // 1. Verificar estado inicial del usuario
  useEffect(() => {
    if (hasVerified.current || isRedirecting.current) return;
    if (loading) return;
    
    if (!user || role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const checkSetup = async () => {
      try {
        const ref = doc(db, "2fa", user.uid);
        const snap = await getDoc(ref);

        // 🔥 CORRECCIÓN: Si ya existe el secret, solo verificar
        if (snap.exists() && snap.data().twoFactorSecret) {
          console.log("✅ Usuario ya tiene 2FA configurado");
          setSecret(snap.data().twoFactorSecret);
          setStep("verify"); // Solo mostrar input de código
        } else {
          // 🆕 Primera vez: Generar QR nuevo
          console.log("🆕 Generando 2FA por primera vez");
          const res = await fetch("/api/auth/2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "generate" }),
          });
          
          if (!res.ok) {
            throw new Error("Error al generar QR");
          }
          
          const data = await res.json();
          setSecret(data.secret);
          setQrCode(data.qrCode);
          setStep("setup");
        }
      } catch (err) {
        console.error("Error en checkSetup:", err);
        toast.error("Error cargando seguridad");
      }
    };

    checkSetup();
  }, [user, role, loading, router]);

  // 2. Manejar el envío del código
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verifying || isRedirecting.current) return;
    
    setVerifying(true);

    try {
      console.log("🔐 Verificando código 2FA...");
      console.log("📝 Secret usado:", secret.substring(0, 8) + "...");
      
      // A. Validar con la API usando el secret correcto
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify", 
          token, 
          secret // 🔥 Este es el secret de Firestore o el recién generado
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Código incorrecto");
      }

      console.log("✅ Código válido");

      // B. Si estamos en setup (primera vez), guardar en Firestore
      if (step === "setup" && user) {
        console.log("💾 Guardando secret en Firestore...");
        await setDoc(doc(db, "2fa", user.uid), {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          role: "admin",
          email: user.email,
          displayName: user.displayName || "Admin",
          createdAt: new Date().toISOString(),
        }, { merge: true });
        
        console.log("✅ Secret guardado en Firestore");
      }

      // C. Marcar como verificado y redirigir
      hasVerified.current = true;
      isRedirecting.current = true;

      toast.success("✅ Verificado correctamente");
      console.log("🚀 Redirigiendo a dashboard...");
      
      // Pequeño delay para que la cookie se establezca
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);

    } catch (err: any) {
      console.error("❌ Error en verificación:", err);
      toast.error(err.message || "Error en la verificación");
      setToken("");
      setVerifying(false);
    }
  };

  if (step === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Cargando seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-gray-100 text-center animate-in fade-in zoom-in duration-300 relative">
        
        {/* 🔥 Botón de logout en la esquina superior derecha */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all group"
          title="Volver al login"
        >
          <FiLogOut className="text-xl group-hover:scale-110 transition-transform" />
        </button>

        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiShield className="text-blue-600 text-3xl" />
        </div>

        <h1 className="text-2xl font-bold text-[#0C212D] mb-2">
          {step === "setup" ? "Configura tu 2FA" : "Verificación Admin"}
        </h1>
        
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {step === "setup" 
            ? "Escanea este código con Google Authenticator para asegurar tu cuenta." 
            : "Ingresa el código de 6 dígitos de tu aplicación autenticadora."}
        </p>

        {/* 🔥 Solo mostrar QR si es primera vez (setup) */}
        {step === "setup" && qrCode && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-xl inline-block bg-gray-50">
            <Image src={qrCode} alt="QR Code" width={160} height={160} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000 000"
            className="w-full text-center text-3xl tracking-[0.5em] font-mono py-3 border-b-2 border-gray-200 focus:border-[#EE7203] outline-none transition-colors bg-transparent placeholder-gray-300 text-[#0C212D]"
            autoFocus
            disabled={verifying}
          />

          <button
            type="submit"
            disabled={token.length !== 6 || verifying}
            className="w-full py-4 bg-[#0C212D] text-white rounded-xl font-bold hover:bg-[#112C3E] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
          >
            {verifying ? "Verificando..." : "Validar Acceso"}
            {!verifying && <FiCheck size={20} />}
          </button>
        </form>
        
        {/* 🔥 Solo mostrar código manual en setup (primera vez) */}
        {step === "setup" && (
          <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 pt-4">
            Si no puedes escanear, el código manual es: <br/>
            <span className="font-mono text-[#EE7203] font-bold select-all">{secret}</span>
          </p>
        )}

        {/* 🔥 Botón alternativo de logout abajo (opcional, más visible) */}
        <button
          onClick={handleLogout}
          className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 mx-auto group"
        >
          <FiLogOut className="text-base group-hover:-translate-x-1 transition-transform" />
          Volver al login
        </button>
      </div>
    </div>
  );
}