"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // ajustá el path

interface ProtectedCourseProps {
  children: React.ReactNode;
  courseId: string;
}

export default function ProtectedCourse({ children, courseId }: ProtectedCourseProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

useEffect(() => {
  if (!userProfile) return;

  if (userProfile.role === "admin" || userProfile.role === "profesor") {
    setAuthorized(true);
    return;
  }

  // alumno: verificar que el curso está en sus cursosAdquiridos
  const cursosAdquiridos = userProfile.cursosAdquiridos || [];
  setAuthorized(cursosAdquiridos.includes(courseId));
}, [userProfile, courseId]);

  // 🔸 loading
  if (authorized === null) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        Checking access...
      </div>
    );
  }

  // 🔸 no autorizado
  if (!authorized) {
    router.push("/dashboard"); // o mostrar mensaje
    return null;
  }

  // 🔸 autorizado
  return <>{children}</>;
}
