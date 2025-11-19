"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FiBookOpen, FiTrendingUp, FiClock, FiUser } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";

export default function AlumnoCoursesPage() {
  const { misCursos, loadingCursos } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  if (loadingCursos)
    return (
      <div className="p-8 text-slate-500 bg-gray-50 min-h-screen flex items-center justify-center">
        {t("courses.loading")}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("courses.title")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("courses.subtitle")}
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {misCursos.length === 0 ? (
        <div className="border border-dashed border-gray-300 p-10 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 mb-2 text-sm">
            {t("courses.emptyMessage")}
          </p>
          <p className="text-gray-400 text-xs">
            {t("courses.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {misCursos.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {c.titulo || t("courses.untitled")}
                </h2>
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {c.categoria || t("courses.generalCategory")}
                </span>
              </div>

              {/* INFO BLOCK */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
                <InfoItem
                  icon={<FiBookOpen />}
                  label={t("courses.units")}
                  value={c.unidades?.length || 0}
                />
                <InfoItem
                  icon={<FiClock />}
                  label={t("courses.duration")}
                  value={`${c.unidades?.reduce(
                    (acc: number, u: any) => acc + (u.duracion || 0),
                    0
                  )} min`}
                />
                <InfoItem
                  icon={<FiTrendingUp />}
                  label={t("courses.progress")}
                  value={`${c.progressPercent || 0}%`}
                />
                <InfoItem
                  icon={<FiUser />}
                  label={t("courses.teacher")}
                  value={c.profesorNombre || t("courses.noTeacher")}
                />
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {t("courses.lessonsCompleted", {
                      done: c.completedCount,
                      total: c.totalLessons,
                    })}
                  </span>
                  <span>{c.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${c.progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <Button
                  onClick={() => router.push(`/material-academico/${c.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-2 text-sm"
                >
                  {c.progressPercent >= 100
                    ? t("courses.review")
                    : t("courses.continue")}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/material-academico/${c.id}`)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2 text-sm"
                >
                  {t("courses.viewDetails")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* 🔹 INFO ITEM */
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
