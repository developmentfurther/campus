"use client";

import React from 'react';
import { useDashboardUI } from '@/stores/useDashboardUI';
import { useAuth } from '@/contexts/AuthContext';
import { Headphones, Mic2, PlayCircle, Calendar, Clock } from 'lucide-react';

// --- Helper para formatear tiempo ---
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function PodcastsSection() {
  const { playPodcast } = useDashboardUI(); 
  const { podcastEpisodes, loadingPodcast } = useAuth(); // ✅ Corregido

  return (
    <div className="min-h-full w-full bg-gray-50 p-6 md:p-12 pb-40 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="mb-10 max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE7203]/10 text-[#EE7203]">
            <Headphones size={16} />
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-[#0C212D]/60">Further Cast</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0C212D]">
          Learn at your own <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EE7203] to-[#FF3816]">Pace</span>
        </h2>
        <p className="mt-4 text-lg text-gray-500 font-light leading-relaxed mx-auto max-w-2xl">
         The Further Records podcast with episodes designed to boost your English and professional skills.
        </p>
      </div>

      {/* --- CARD PRINCIPAL --- */}
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border-2 border-[#EE7203]/20 bg-white shadow-xl overflow-hidden">
          
          {/* Header Naranja */}
          <div className="relative bg-gradient-to-br from-[#EE7203] to-[#FF3816] p-6">
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Mic2 size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Further Records</h3>
                <p className="text-white/90 text-sm">Last episodes</p>
              </div>
            </div>
            {/* Decoración */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* --- LISTA DE EPISODIOS (Custom UI) --- */}
          <div className="bg-gray-50 min-h-[352px]">
            {loadingPodcast ? ( // ✅ Corregido
              <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
                Loading episodes...
              </div>
            ) : podcastEpisodes.length === 0 ? ( // ✅ Agregado manejo de array vacío
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Headphones size={48} className="mb-4 opacity-50" />
                <p>No episodes availables</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {podcastEpisodes.map((ep) => ( // ✅ Corregido
                  <div key={ep.id} className="group p-4 hover:bg-white transition-colors flex gap-4 items-start">
                    
                    {/* Imagen (Thumb) */}
                    <img 
                      src={ep.images[1]?.url || ep.images[0]?.url} 
                      alt={ep.name}
                      className="w-16 h-16 rounded-lg object-cover shadow-sm bg-gray-200 flex-shrink-0"
                    />

                    {/* Info Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#0C212D] group-hover:text-[#EE7203] transition-colors truncate pr-4">
                        {ep.name}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-2">
                        {ep.description}
                      </p>
                      
                      {/* Metadatos */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(ep.release_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formatDuration(ep.duration_ms)}
                        </span>
                      </div>
                    </div>

                    {/* Acción: Play */}
                    <button
                      onClick={() => playPodcast(`https://open.spotify.com/embed/episode/${ep.id}`)}
                      className="mt-2 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-[#EE7203]/10 text-[#EE7203] hover:bg-[#EE7203] hover:text-white transition-all transform hover:scale-105"
                      aria-label={`Listen ${ep.name} in the player`}
                    >
                      <PlayCircle size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con plataformas */}
          <div className="p-6 bg-white border-t border-gray-100">
            {/* También disponible en */}
            <div className="pt-6">
              <p className="text-sm text-gray-500 mb-3 text-center">Also available in:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a 
                  href="https://podcasts.apple.com/es/podcast/further-records/id1771034234" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#EE7203] hover:bg-[#EE7203]/5 transition-all group"
                >
                  <svg className="h-5 w-5 text-[#A855F7] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Apple Podcasts</span>
                </a>

                <a 
                  href="https://music.amazon.com/podcasts/5caa1c4a-442f-475c-b2b7-96587d0eecc2/further-records" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#EE7203] hover:bg-[#EE7203]/5 transition-all group"
                >
                  <svg className="h-5 w-5 text-[#00A8E1] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6c0-1.505.78-3.08 2.324-4.993C4.632 1.35 5.046 1.69 5 2.084c-.046.394-.516.623-.518.623C3.178 3.667 2.5 4.977 2.5 6c0 1.023.678 2.333 1.982 3.293 0 0 .472.229.518.623.046.394-.368.734-.676 1.077C3.78 9.08 3 7.505 3 6z"/>
                    <path d="M4.602 8.475c-.551-.37-1.102-1.073-1.102-1.973 0-.9.551-1.603 1.102-1.973.088-.058.19-.04.23.044.04.084 0 .192-.088.248-.48.323-.914.883-.914 1.681s.434 1.358.914 1.681c.088.056.129.164.088.248-.04.084-.142.102-.23.044z"/>
                    <path d="M22 6c0 1.505-.78 3.08-2.324 4.993-.308-.343-.722-.683-.676-1.077.046-.394.518-.623.518-.623C20.822 8.333 21.5 7.023 21.5 6c0-1.023-.678-2.333-1.982-3.293 0 0-.472-.229-.518-.623-.046-.394.368-.734.676-1.077C21.22 2.92 22 4.495 22 6z"/>
                    <path d="M19.398 7.525c.551-.37 1.102-1.073 1.102-1.973 0-.9-.551-1.603-1.102-1.973-.088-.058-.19-.04-.23.044-.04.084 0 .192.088.248.48.323.914.883.914 1.681s-.434 1.358-.914 1.681c-.088.056-.129.164-.088.248.04.084.142.102.23.044z"/>
                    <path d="M12 4c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10.5c-2.481 0-4.5-2.019-4.5-4.5s2.019-4.5 4.5-4.5 4.5 2.019 4.5 4.5-2.019 4.5-4.5 4.5z"/>
                    <path d="M12 8c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Amazon Music</span>
                </a>

                <a 
                  href="https://www.youtube.com/playlist?app=desktop&list=PLNccVrIVJ8qP2ACXgZOUSzLvhBWL-REbs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#EE7203] hover:bg-[#EE7203]/5 transition-all group"
                >
                  <svg className="h-5 w-5 text-[#FF0000] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- INFORMACIÓN ADICIONAL --- */}
      <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-[#EE7203]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-[#0C212D] mb-2">Real vocabulary</h4>
          <p className="text-sm text-gray-600">Learn expressions and terms used in the professional world</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-[#EE7203]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-[#0C212D] mb-2">Pronunciation</h4>
          <p className="text-sm text-gray-600">Listen and practice correct pronunciation with native speakers.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-[#EE7203]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-[#0C212D] mb-2">Short Episodes</h4>
          <p className="text-sm text-gray-600">Digestible content perfect for learning anytime.</p>
        </div>
      </div>
    </div>
  );
}