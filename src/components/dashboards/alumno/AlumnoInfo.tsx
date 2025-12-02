"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiUser,
  FiMail,
  FiKey,
  FiBook,
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiCheck,
  FiExternalLink,
} from "react-icons/fi";

interface ImportantInfoProps {
  studentData?: {
    name: string;
    email: string;
    studentId: string;
    enrollmentDate: string;
    course: string;
    tutor: string;
    tutorEmail: string;
    platformAccess: string;
    supportEmail: string;
    supportPhone: string;
    learningPlatform: string;
    scheduleInfo: string;
  };
}

export default function AlumnoInfo({ studentData }: ImportantInfoProps) {
  // Datos de ejemplo (en producción vendrían por props)
  const data = studentData || {
    name: "Ana García Martínez",
    email: "ana.garcia@ejemplo.com",
    studentId: "EST-2024-001234",
    enrollmentDate: "15 de Enero, 2024",
    course: "Desarrollo Web Full Stack",
    tutor: "Prof. Carlos Rodríguez",
    tutorEmail: "carlos.rodriguez@tutor.com",
    platformAccess: "https://campus.plataforma.com",
    supportEmail: "soporte@plataforma.com",
    supportPhone: "+34 900 123 456",
    learningPlatform: "Campus Virtual",
    scheduleInfo: "Lunes a Viernes, 9:00 - 18:00",
  };

  const [expandedSection, setExpandedSection] = useState<string | null>("welcome");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: "welcome",
      icon: FiInfo,
      title: "Bienvenida",
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-4">
          <p className="text-[#0C212D]/80 leading-relaxed">
            ¡Bienvenido/a a nuestra plataforma educativa! Estamos encantados de tenerte como parte de nuestra comunidad de aprendizaje.
          </p>
          <div className="bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 rounded-xl p-4 border border-[#EE7203]/20">
            <p className="text-sm text-[#0C212D]/70">
              Esta sección contiene toda la información importante que necesitas para comenzar. Te recomendamos guardar esta página en favoritos para consultarla cuando lo necesites.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "personal",
      icon: FiUser,
      title: "Datos Personales",
      color: "from-[#0C212D] to-[#112C3E]",
      content: (
        <div className="space-y-3">
          <InfoRow
            label="Nombre completo"
            value={data.name}
            icon={FiUser}
            onCopy={() => copyToClipboard(data.name, "name")}
            copied={copiedField === "name"}
          />
          <InfoRow
            label="Email"
            value={data.email}
            icon={FiMail}
            onCopy={() => copyToClipboard(data.email, "email")}
            copied={copiedField === "email"}
          />
          <InfoRow
            label="ID de Estudiante"
            value={data.studentId}
            icon={FiKey}
            onCopy={() => copyToClipboard(data.studentId, "id")}
            copied={copiedField === "id"}
          />
          <InfoRow
            label="Fecha de alta"
            value={data.enrollmentDate}
            icon={FiCalendar}
          />
        </div>
      ),
    },
    {
      id: "course",
      icon: FiBook,
      title: "Información del Curso",
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-3">
          <InfoRow label="Curso" value={data.course} icon={FiBook} />
          <InfoRow label="Tutor asignado" value={data.tutor} icon={FiUser} />
          <InfoRow
            label="Email del tutor"
            value={data.tutorEmail}
            icon={FiMail}
            onCopy={() => copyToClipboard(data.tutorEmail, "tutorEmail")}
            copied={copiedField === "tutorEmail"}
          />
          <div className="bg-[#EE7203]/10 rounded-xl p-4 border border-[#EE7203]/20 mt-4">
            <p className="text-sm text-[#0C212D]/70">
              <strong className="text-[#0C212D]">Nota:</strong> Puedes contactar a tu tutor directamente desde la sección de mensajería del campus.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "access",
      icon: FiExternalLink,
      title: "Acceso a la Plataforma",
      color: "from-[#0C212D] to-[#112C3E]",
      content: (
        <div className="space-y-4">
          <InfoRow
            label="Plataforma"
            value={data.learningPlatform}
            icon={FiBook}
          />
          <InfoRow
            label="URL de acceso"
            value={data.platformAccess}
            icon={FiExternalLink}
            onCopy={() => copyToClipboard(data.platformAccess, "url")}
            copied={copiedField === "url"}
            isLink
          />
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <p className="text-sm text-[#0C212D]/70">
              <strong className="text-[#0C212D]">Importante:</strong> Usa las credenciales que recibiste por email para iniciar sesión. Si olvidaste tu contraseña, usa la opción "Recuperar contraseña".
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "support",
      icon: FiHelpCircle,
      title: "Soporte y Ayuda",
      color: "from-[#EE7203] to-[#FF3816]",
      content: (
        <div className="space-y-3">
          <InfoRow
            label="Email de soporte"
            value={data.supportEmail}
            icon={FiMail}
            onCopy={() => copyToClipboard(data.supportEmail, "support")}
            copied={copiedField === "support"}
          />
          <InfoRow
            label="Teléfono de soporte"
            value={data.supportPhone}
            icon={FiMessageSquare}
            onCopy={() => copyToClipboard(data.supportPhone, "phone")}
            copied={copiedField === "phone"}
          />
          <InfoRow
            label="Horario de atención"
            value={data.scheduleInfo}
            icon={FiClock}
          />
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 mt-4">
            <p className="text-sm text-[#0C212D]/70">
              <strong className="text-[#0C212D]">Consejo:</strong> Nuestro equipo de soporte está disponible para ayudarte con cualquier duda técnica o académica.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-6 py-2 rounded-full mb-4 shadow-lg">
            <FiInfo className="text-white" size={20} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Campus Virtual
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-2">
            Información Importante
          </h1>
          <p className="text-[#0C212D]/70 text-lg">
            Toda la información que necesitas en un solo lugar
          </p>
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
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Header de la sección */}
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

                {/* Contenido expandible */}
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

        {/* Footer informativo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EE7203] flex items-center justify-center flex-shrink-0">
              <FiInfo className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Si tienes alguna pregunta o necesitas asistencia adicional, no dudes en contactar con nuestro equipo de soporte. Estamos aquí para ayudarte en tu proceso de aprendizaje.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar filas de información
function InfoRow({
  label,
  value,
  icon: Icon,
  onCopy,
  copied,
  isLink,
}: {
  label: string;
  value: string;
  icon: any;
  onCopy?: () => void;
  copied?: boolean;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#EE7203]/30 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-[#EE7203]/30 transition-colors">
          <Icon className="text-[#0C212D]/60" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#0C212D]/60 font-medium mb-0.5">
            {label}
          </p>
          {isLink ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#EE7203] hover:text-[#FF3816] truncate block"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm font-semibold text-[#0C212D] truncate">
              {value}
            </p>
          )}
        </div>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="ml-2 p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0"
          title="Copiar"
        >
          {copied ? (
            <FiCheck className="text-emerald-500" size={18} />
          ) : (
            <FiCopy className="text-[#0C212D]/40 hover:text-[#EE7203]" size={18} />
          )}
        </button>
      )}
    </div>
  );
}