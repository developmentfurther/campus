"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiCalendar,
  FiClock,
  FiMail,
  FiMessageSquare,
  FiChevronDown,
  FiX,
  FiVideo,
  FiGlobe,
  FiAward,
  FiHelpCircle,
} from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";
import InfoTutorial from "@/components/tutoriales/InfoTutorial";

interface AlumnoInfoProps {
  userEmail?: string;
}

export default function AlumnoInfo({ userEmail = "test@gmail.com" }: AlumnoInfoProps) {
  const { t } = useI18n();

  const [expandedSection, setExpandedSection] = useState<string | null>("welcome");

  const isAccenture = (userEmail || "").toLowerCase().includes("@accenture.com");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Configuración dinámica según Accenture
  const config = {
    cancellationHours: isAccenture ? "24" : "48",
    cancellationPercentage: "25%",
    tableData: [
      {
        title: t("information.sections.cancellations.types.withNoticeTitle"),
        description: isAccenture
          ? t("information.sections.cancellations.types.withNoticeDescAccent")
          : t("information.sections.cancellations.types.withNoticeDescGeneral"),
      },
      {
        title: t("information.sections.cancellations.types.withoutNoticeTitle"),
        description: isAccenture
          ? t("information.sections.cancellations.types.withoutNoticeDescAccent")
          : t("information.sections.cancellations.types.withoutNoticeDescGeneral"),
      },
      {
        title: t("information.sections.cancellations.types.excessTitle"),
        description: isAccenture
          ? t("information.sections.cancellations.types.excessDescAccent")
          : t("information.sections.cancellations.types.excessDescGeneral"),
      },
    ],
  };

  const sections = [
    {
      id: "welcome",
      icon: FiInfo,
      title: t("information.sections.welcome.title"),
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-4">
          <p className="text-[#0C212D]/80 leading-relaxed">
            {t("information.sections.welcome.p1")}
          </p>
          <div className="bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 rounded-xl p-4 border border-[#EE7203]/20">
            <p className="text-sm text-[#0C212D]/70">
              {t("information.sections.welcome.p2")}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "cancellations",
      icon: FiCalendar,
      title: t("information.sections.cancellations.title"),
      color: "from-[#0C212D] to-[#112C3E]",
      content: (
        <div className="space-y-4">
          {/* Horas de anticipación */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <FiClock className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-[#0C212D] mb-2">
                  {t("information.sections.cancellations.question")}
                </h3>
                <p className="text-[#0C212D]/80 text-sm mb-2">
                  <strong>
                    {config.cancellationHours}
                    {t("information.sections.cancellations.hoursSuffix")}
                  </strong>
                </p>
                {!isAccenture && (
                  <p className="text-[#0C212D]/70 text-sm">
                    {t("information.sections.cancellations.nonAccentureNote")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Importante */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <FiInfo className="text-amber-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-[#0C212D] mb-2">
                  {t("information.sections.cancellations.importantTitle")}
                </h3>
                <p className="text-[#0C212D]/70 text-sm">
                  {t("information.sections.cancellations.importantDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Dónde notificar */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#0C212D] flex items-center gap-2">
              <FiMail size={18} />
              {t("information.sections.cancellations.whereNotify")}
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <a
                href="mailto:cancelaciones@furtherenglish.com"
                className="text-[#EE7203] font-semibold hover:text-[#FF3816] transition-colors"
              >
                cancelaciones@furtherenglish.com
              </a>

              <p className="text-sm text-[#0C212D]/70 mt-3">
                {t("information.sections.cancellations.individual")}
              </p>

              <ul className="text-sm text-[#0C212D]/70 mt-2 space-y-1 ml-4">
                <li>• {t("information.sections.cancellations.individual")}</li>
                <li>
                  • {t("information.sections.cancellations.group")}
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>- {t("information.sections.cancellations.groupAll")}</li>
                    <li>- {t("information.sections.cancellations.groupAbsences")}</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          {/* Cantidad de cancelaciones */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <FiX className="text-red-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-[#0C212D] mb-2">
                  {t("information.sections.cancellations.howManyTitle")}
                </h3>
                <p className="text-[#0C212D]/80 text-sm">
                  {t("information.sections.cancellations.howManyDescPrefix")}
                  <strong>{config.cancellationPercentage}</strong>
                  {t("information.sections.cancellations.howManyDescSuffix")}
                </p>
              </div>
            </div>
          </div>

          {/* Recupero de clases */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-start gap-3">
              <FiAward className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-[#0C212D] mb-2">
                  {t("information.sections.cancellations.recoverTitle")}
                </h3>
                <p className="text-[#0C212D]/80 text-sm">
                  {t("information.sections.cancellations.recoverDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Tipos de cancelación */}
          <div className="mt-6">
            <h3 className="font-bold text-[#0C212D] mb-4">
              {t("information.sections.cancellations.typesTitle")}
            </h3>

            <div className="grid md:grid-cols-3 gap-3">
              {config.tableData.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-[#EE7203]/50 transition-colors"
                >
                  <h4 className="font-bold text-[#0C212D] text-sm mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#0C212D]/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "project",
      icon: FiAward,
      title: t("information.sections.project.title"),
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 rounded-xl p-5 border border-[#EE7203]/20">
            <h3 className="font-bold text-[#0C212D] mb-3 flex items-center gap-2">
              <FiAward size={20} />
              {t("information.sections.project.subtitle")}
            </h3>

            <p className="text-[#0C212D]/80 text-sm leading-relaxed">
              {t("information.sections.project.p1")}
            </p>

            <p className="text-[#0C212D]/80 text-sm leading-relaxed mt-3">
              {t("information.sections.project.p2")}
            </p>
          </div>

          {/* Encuestas */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <h3 className="font-bold text-[#0C212D] mb-3 flex items-center gap-2">
              <FiMessageSquare size={20} />
              {t("information.sections.project.surveyTitle")}
            </h3>
            <p className="text-[#0C212D]/80 text-sm leading-relaxed">
              {t("information.sections.project.surveyDesc")}
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-xl p-5 text-white">
            <p className="text-sm leading-relaxed">
              {t("information.sections.project.closing")}
            </p>
          </div>
        </div>
      ),
    },

    {
      id: "camera",
      icon: FiVideo,
      title: t("information.sections.camera.title"),
      color: "from-[#0C212D] to-[#112C3E]",
      content: (
        <div className="space-y-3">
          <p className="text-[#0C212D]/80 text-sm mb-4">
            {t("information.sections.camera.intro")}
          </p>

          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#EE7203]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-[#0C212D] text-sm mb-1">
                    {t(`information.sections.camera.benefits.b${i + 1}t`)}
                  </h4>
                  <p className="text-xs text-[#0C212D]/70">
                    {t(`information.sections.camera.benefits.b${i + 1}d`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    {
      id: "approach",
      icon: FiGlobe,
      title: t("information.sections.approach.title"),
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 rounded-xl p-5 border border-[#EE7203]/20">
            <h3 className="font-bold text-[#0C212D] mb-3">
              {t("information.sections.approach.title")}
            </h3>
            <p className="text-[#0C212D]/80 text-sm leading-relaxed">
              {t("information.sections.approach.desc")}
            </p>
          </div>

          <h3 className="font-bold text-[#0C212D] mt-6 mb-3">
            {t("information.sections.approach.benefitsTitle")}
          </h3>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                <h4 className="font-bold text-[#0C212D] text-sm mb-2">
                  {t(`information.sections.approach.benefits.b${i + 1}t`)}
                </h4>
                <p className="text-xs text-[#0C212D]/70 leading-relaxed">
                  {t(`information.sections.approach.benefits.b${i + 1}d`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    {
      id: "communication",
      icon: FiMail,
      title: t("information.sections.communication.title"),
      color: "from-[#0C212D] to-[#112C3E]",
      content: (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <h3 className="font-bold text-[#0C212D] mb-3 flex items-center gap-2">
              <FiInfo size={20} />
              {t("information.sections.communication.subtitle")}
            </h3>
            <p className="text-[#0C212D]/80 text-sm leading-relaxed mb-3">
              {t("information.sections.communication.p1")}
            </p>
            <p className="text-[#0C212D]/80 text-sm leading-relaxed mb-3">
              {t("information.sections.communication.p2")}
            </p>
            <p className="text-[#0C212D]/70 text-xs italic">
              {t("information.sections.communication.note")}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-[#EE7203]/30">
            <h3 className="font-bold text-[#0C212D] mb-4">
              {t("information.sections.communication.contactsTitle")}
            </h3>

            <div className="space-y-3">
              {/* Coordinación académica */}
              <a
                href={`mailto:${t("information.sections.communication.contactAcademicMail")}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-[#EE7203]/10 transition-colors group"
              >
                <FiMail className="text-[#EE7203] group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <p className="text-xs text-[#0C212D]/60 font-medium">
                    {t("information.sections.communication.contactAcademic")}
                  </p>
                  <p className="text-sm font-semibold text-[#0C212D]">
                    {t("information.sections.communication.contactAcademicMail")}
                  </p>
                </div>
              </a>

              {/* Cancelaciones */}
              <a
                href={`mailto:${t("information.sections.communication.contactCancelMail")}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-[#EE7203]/10 transition-colors group"
              >
                <FiCalendar className="text-[#EE7203] group-hover:scale-110 transition-transform" size={20} />
                <div>
                  <p className="text-xs text-[#0C212D]/60 font-medium">
                    {t("information.sections.communication.contactCancel")}
                  </p>
                  <p className="text-sm font-semibold text-[#0C212D]">
                    {t("information.sections.communication.contactCancelMail")}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "survey",
      icon: FiHelpCircle,
      title: t("information.sections.survey.title"),
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 rounded-xl p-5 border border-[#EE7203]/20">
            <h3 className="font-bold text-[#0C212D] mb-3">
              {t("information.sections.survey.title")}
            </h3>
            <p className="text-[#0C212D]/80 text-sm leading-relaxed mb-4">
              {t("information.sections.survey.desc")}
            </p>

            <a
              href="https://forms.gle/DXa1RXgeHtLtTRSh7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
            >
              {t("information.sections.survey.ctaLabel")}
              <FiAward size={18} />
            </a>
          </div>

          <p className="text-center text-[#0C212D]/70 text-sm">
            {t("information.sections.survey.closing")}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <InfoTutorial />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          data-tutorial="info-header"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-6 py-2 rounded-full mb-4 shadow-lg">
            <FiInfo className="text-white" size={20} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              {t("information.header.badge")}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-2">
            {t("information.header.title")}
          </h1>

          <p className="text-[#0C212D]/70 text-lg">
            {t("information.header.subtitle")}
          </p>

          {isAccenture && (
            <div className="mt-3 inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold">
              {t("information.header.accentureTag")}
            </div>
          )}
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-tutorial={`section-${section.id}`}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-[#0C212D]">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiChevronDown className="text-[#0C212D]" size={24} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="pt-4">{section.content}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl p-6 shadow-xl"
        data-tutorial="info-footer"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EE7203] flex items-center justify-center flex-shrink-0">
              <FiInfo className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">
                {t("information.footer.title")}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t("information.footer.desc")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
