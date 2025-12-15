"use client";
import React from 'react';
import { useDashboardUI } from '@/stores/useDashboardUI';
import { X, Mic2 } from 'lucide-react';

export const GlobalPodcast = () => {
  const { currentPodcastUrl, isPlayerVisible, closePlayer } = useDashboardUI();

  if (!isPlayerVisible || !currentPodcastUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] w-full lg:left-64 lg:w-[calc(100%-16rem)]">
      
      {/* Card del Player */}
      <div className="relative w-full border-t-2 border-[#EE7203] bg-white shadow-2xl">
        
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203]" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 p-3 md:gap-4 md:px-6 md:py-4">
            
            {/* Ícono + Info del Podcast */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-lg">
                <Mic2 size={22} className="text-white" />
              </div>
              
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#EE7203] uppercase tracking-wide">
                  Reproduciendo ahora
                </p>
                <p className="text-sm font-bold text-[#0C212D]">
                  Campus Podcast
                </p>
              </div>
            </div>

            {/* Iframe de Spotify */}
            <div className="flex-1 overflow-hidden rounded-xl bg-gray-50 shadow-inner border border-gray-200">
              <iframe 
                src={`${currentPodcastUrl}?theme=0`} 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="w-full"
              ></iframe>
            </div>

            {/* Botón Cerrar */}
            <button 
              onClick={closePlayer}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-[#FF3816] hover:text-white hover:rotate-90 hover:scale-110 active:scale-95 shadow-md"
              aria-label="Cerrar reproductor"
            >
              <X size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};