"use client";

import { FiAward, FiBookOpen } from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";
import { useDashboardUI } from "@/stores/useDashboardUI";


export default function AlumnoCertificatesPage() {
  const { t } = useI18n();
  const { setSection } = useDashboardUI();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-10 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
            <h1 className="text-4xl font-black text-[#0C212D]">
              {t("certificates.title")}
            </h1>
          </div>
          
          <p className="text-[#112C3E]/70 text-lg max-w-2xl">
            {t("certificates.subtitle")}
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-gray-100 shadow-2xl">
          
          {/* Decorative header bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203]"></div>

          <div className="p-10 md:p-12">
            
            {/* Icon section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#EE7203] to-[#FF3816] blur-3xl opacity-20 rounded-full"></div>
                
                {/* Icon container */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <FiAward className="text-white" size={48} />
                </div>
              </div>
            </div>

            {/* Empty state */}
            <div className="max-w-2xl mx-auto">
              
              {/* Certificate preview */}
              <div className="relative mb-8">
                {/* Decorative background pattern */}
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(12, 33, 45, 0.3) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                  }}
                ></div>
                
                <div className="relative border-2 border-dashed border-[#0C212D]/20 rounded-2xl p-12 bg-gradient-to-br from-gray-50 to-white">
                  
                  {/* Certificate mockup */}
                  <div className="bg-white border-4 border-[#EE7203]/30 rounded-xl p-8 shadow-lg">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-full mx-auto flex items-center justify-center mb-4">
                        <FiAward className="text-white" size={32} />
                      </div>
                      
                      <div className="h-3 bg-gradient-to-r from-transparent via-[#0C212D]/20 to-transparent rounded"></div>
                      <div className="h-3 bg-gradient-to-r from-transparent via-[#0C212D]/10 to-transparent rounded w-3/4 mx-auto"></div>
                      
                      <div className="pt-6">
                        <div className="h-2 bg-[#0C212D]/10 rounded w-32 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-[#112C3E]/60 text-sm font-medium mt-6">
                    {t("certificates.emptyPreview")}
                  </p>
                </div>
              </div>

              {/* CTA Message */}
              <div className="text-center bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/5 border-2 border-[#EE7203]/20 rounded-2xl p-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FiBookOpen className="text-[#EE7203]" size={20} />
                  <p className="text-[#0C212D] font-bold">
                    {t("certificates.ctaPrefix")}
                  </p>
                </div>
                
                <button
  onClick={() => setSection("miscursos")}
  className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-[#EE7203]/30 transition-all duration-300 hover:scale-105"
>
  <span>{t("certificates.ctaLink")}</span>
  <span className="transform group-hover:translate-x-1 transition-transform duration-300">
    →
  </span>
</button>
              </div>

            </div>

          </div>

          {/* Decorative corner elements */}
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#EE7203]/5 to-transparent rounded-tl-full"></div>
          <div className="absolute top-20 left-0 w-32 h-32 bg-gradient-to-br from-[#FF3816]/5 to-transparent rounded-br-full"></div>

        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          
          <InfoCard
            title="Complete Courses"
            description="Finish your learning path to unlock certificates"
            gradient="from-[#0C212D] to-[#112C3E]"
          />
          
          <InfoCard
            title="Track Progress"
            description="Monitor your achievements in the dashboard"
            gradient="from-[#EE7203] to-[#FF3816]"
          />
          
          <InfoCard
            title="Download & Share"
            description="Get your certificates in PDF format"
            gradient="from-[#112C3E] to-[#0C212D]"
          />

        </div>

      </div>
    </div>
  );
}

function InfoCard({ title, description, gradient }) {
  return (
    <div className="group relative bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-[#EE7203]/30 hover:shadow-xl transition-all duration-300">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-t-xl`}></div>
      
      <div className="pt-2">
        <h3 className="font-black text-[#0C212D] text-lg mb-2 group-hover:text-[#EE7203] transition-colors">
          {title}
        </h3>
        <p className="text-[#112C3E]/70 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}