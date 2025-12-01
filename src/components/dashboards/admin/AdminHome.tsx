"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import {
  FiUsers,
  FiBookOpen,
  FiBell,
  FiActivity,
  FiCalendar,
  FiMessageCircle,
  FiUser,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";

export default function AdminHome() {
  const { setSection } = useDashboardUI();

  const cards = [
    {
      id: "alumnos",
      label: "Students",
      desc: "Manage student profiles, academic progress, languages, and access settings.",
      extra: "Full access to student list, editing tools, and batch control.",
      icon: <FiUsers size={28} />,
      gradient: "from-[#EE7203] to-[#FF3816]",
    },
    {
      id: "material",
      label: "Academic Material",
      desc: "Create and manage courses, units, lessons, and examinations.",
      extra: "Control over content, videos, PDFs, closing sections, and evaluations.",
      icon: <FiBookOpen size={28} />,
      gradient: "from-[#0C212D] to-[#112C3E]",
    },
    {
      id: "profesores",
      label: "Teachers",
      desc: "Complete administration of the teaching staff.",
      extra: "Update profiles, languages, permissions, and access to materials.",
      icon: <FiActivity size={28} />,
      gradient: "from-[#FF3816] to-[#EE7203]",
    },
    {
      id: "anuncios",
      label: "Announcements",
      desc: "Publish global announcements segmented by language.",
      extra: "Instantly visible to students based on native language.",
      icon: <FiBell size={28} />,
      gradient: "from-[#112C3E] to-[#0C212D]",
    },
    {
      id: "chatbot",
      label: "AI Chat",
      desc: "Administrative view of the AI-powered conversational chat.",
      extra: "Monitor sessions, feedback, and linguistic behavior.",
      icon: <FiMessageCircle size={28} />,
      gradient: "from-[#EE7203] to-[#FF3816]",
    },
    {
      id: "perfil",
      label: "My Profile",
      desc: "Update your personal information and credentials.",
      extra: "Direct access to account settings and language preferences.",
      icon: <FiUser size={28} />,
      gradient: "from-[#0C212D] to-[#112C3E]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] rounded-3xl p-10 md:p-12 text-white shadow-2xl">
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FF3816] opacity-10 rounded-full blur-3xl -ml-36 -mb-36"></div>
          
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, #EE7203 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            
            <div className="flex-1">
              {/* Admin Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full mb-6 shadow-lg">
                <FiShield size={16} className="text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Admin Panel</span>
              </div>

              {/* Animated line */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-transparent max-w-md"></div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
                Admin Dashboard
              </h1>
              
              <p className="text-gray-300 text-lg max-w-2xl leading-relaxed font-medium">
                Quick access to the main management tools of the campus.
              </p>
            </div>

            {/* Date Card */}
            <div className="lg:min-w-[280px]">
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#EE7203] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-lg p-2">
                      <FiCalendar size={20} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-300 uppercase tracking-widest font-bold">Today</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Section Title */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
          <h2 className="text-3xl font-black text-[#0C212D]">Management Tools</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
        </div>

        {/* DASHBOARD CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <AdminCard key={i} card={c} onClick={() => setSection(c.id)} index={i} />
          ))}
        </section>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-400 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF3816] rounded-full"></div>
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
          </div>
          <p className="font-semibold">© {new Date().getFullYear()} Further Campus — Admin Panel</p>
        </footer>
      </div>
    </div>
  );
}

function AdminCard({ card, onClick, index }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-7 shadow-sm hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-[#EE7203]/30 overflow-hidden text-left hover:-translate-y-2"
      style={{
        animation: 'fadeInUp 0.5s ease-out forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0
      }}
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:left-full transition-all duration-1000"></div>
      </div>

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute inset-0 bg-gradient-to-bl from-white/10 to-transparent rounded-full transform translate-x-16 -translate-y-16`}></div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className={`bg-gradient-to-br ${card.gradient} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl`}>
          {card.icon}
        </div>

        {/* Content */}
        <div className="space-y-3 mb-6">
          <h3 className="font-black text-[#0C212D] text-2xl group-hover:text-white transition-colors duration-300">
            {card.label}
          </h3>
          
          <p className="text-sm text-[#112C3E]/80 group-hover:text-white/90 transition-colors duration-300 leading-relaxed font-medium">
            {card.desc}
          </p>
          
          <p className="text-xs text-gray-400 group-hover:text-white/70 transition-colors duration-300 leading-relaxed">
            {card.extra}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center text-[#EE7203] text-sm font-bold group-hover:text-white transition-colors duration-300 pt-4 border-t-2 border-gray-100 group-hover:border-white/20">
          <span className="group-hover:mr-2 transition-all duration-300">Access Module</span>
          <FiArrowRight className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
    </button>
  );
}

// Animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);