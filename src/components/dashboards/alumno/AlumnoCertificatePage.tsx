"use client";

import { FiAward } from "react-icons/fi";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

export default function AlumnoCertificatesPage() {
const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
            <FiAward size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t("certificates.title")}</h1>
            <p className="text-sm text-gray-500">
             {t("certificates.subtitle")}
            </p>
          </div>
        </div>

        {/* CERTIFICATE LIST */}
        <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="mx-auto w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-lg py-10 px-4">
            <p className="text-gray-500 text-sm mb-2">
              {t("certificates.emptyPreview")}
            </p>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            {t("certificates.ctaPrefix")}{" "}
            <Link
              href="#"
              className="text-blue-600 font-semibold hover:underline"
            >
              {t("certificates.ctaLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
