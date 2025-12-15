"use client";
import React from 'react';
import { useDashboardUI } from '@/stores/useDashboardUI';
import { Play, Pause, Clock, Headphones, BarChart3 } from 'lucide-react';

const podcastsData = [
  {
    id: 1,
    category: "Liderazgo",
    title: "Mentalidad de Crecimiento para Devs",
    description: "Cómo afrontar el feedback negativo y convertirlo en código de calidad.",
    duration: "20 min",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60",
    url: "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT" 
  },
  {
    id: 2,
    category: "Productividad",
    title: "Estrategias de Retención y Foco",
    description: "Técnicas de deep work para estudiar inglés sin distracciones.",
    duration: "35 min",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60",
    url: "https://open.spotify.com/embed/track/5nN8BwWjjNxSdCxNC3q49I" 
  },
  {
    id: 3,
    category: "Tech English",
    title: "Domina el Daily Standup",
    description: "Vocabulario esencial para tus reuniones diarias en inglés.",
    duration: "12 min",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
    url: "https://open.spotify.com/embed/track/5nF4mjQezmenJhc8y8k11C" 
  },
  {
    id: 4,
    category: "Soft Skills",
    title: "Comunicación Asertiva",
    description: "Mejora tus habilidades blandas en entornos remotos.",
    duration: "28 min",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=60",
    url: "http://googleusercontent.com/spotify.com/4" 
  },
];

export default function PodcastsSection() {
  const { playPodcast, currentPodcastUrl, isPlayerVisible } = useDashboardUI();

  return (
    // Fondo base claro (Gray-50) para que las tarjetas blancas resalten
    <div className="min-h-full w-full bg-gray-50 p-6 md:p-12 pb-40 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="mb-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EE7203]/10 text-[#EE7203]">
                <Headphones size={16} />
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-[#0C212D]/60">Further Cast</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0C212D]">
          Aprende a tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EE7203] to-[#FF3816]">Ritmo</span>
        </h2>
        <p className="mt-4 text-lg text-gray-500 font-light max-w-2xl leading-relaxed">
          Una colección curada de audios para potenciar tu inglés y tus habilidades profesionales mientras navegas por el campus.
        </p>
      </div>

      {/* --- GRID DE EPISODIOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {podcastsData.map((pod) => {
          const isPlaying = currentPodcastUrl?.includes(pod.url) && isPlayerVisible;
          
          return (
            <div 
              key={pod.id}
              onClick={() => playPodcast(pod.url)}
              className={`
                group relative flex flex-col overflow-hidden rounded-2xl bg-white 
                transition-all duration-300 cursor-pointer
                border border-gray-100
                hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(12,33,45,0.1)]
                ${isPlaying ? 'ring-2 ring-[#EE7203] shadow-lg' : ''}
              `}
            >
              {/* Contenedor Imagen */}
              <div className="relative h-52 w-full overflow-hidden">
                 <img 
                    src={pod.image} 
                    alt={pod.title} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                 />
                 
                 {/* Overlay degradado sutil solo abajo para leer texto si lo hubiera, o estético */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0C212D]/60 via-transparent to-transparent opacity-60" />

                 {/* Botón Play Flotante - Glassmorphism */}
                 <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm text-[#EE7203] hover:bg-[#EE7203] hover:text-white transition-colors">
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1"/>}
                    </button>
                 </div>

                 {/* Badge de Categoría */}
                 <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center rounded-md bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-[#0C212D] shadow-sm">
                        {pod.category}
                    </span>
                 </div>
              </div>

              {/* Contenido Card */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Clock size={14} />
                        {pod.duration}
                    </div>
                    
                    {/* Indicador visual de Audio activo */}
                    {isPlaying && (
                        <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 h-full bg-[#EE7203] animate-[bounce_1s_infinite]"></span>
                            <span className="w-1 h-2/3 bg-[#FF3816] animate-[bounce_1.2s_infinite]"></span>
                            <span className="w-1 h-3/4 bg-[#EE7203] animate-[bounce_0.8s_infinite]"></span>
                        </div>
                    )}
                </div>

                <h3 className={`text-xl font-bold leading-tight mb-2 transition-colors ${isPlaying ? 'text-[#EE7203]' : 'text-[#0C212D] group-hover:text-[#EE7203]'}`}>
                  {pod.title}
                </h3>
                
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                    {pod.description}
                </p>

                {/* Footer de la Card */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0C212D]/40 group-hover:text-[#0C212D] transition-colors">
                        ESCUCHAR AHORA
                    </span>
                    <BarChart3 size={16} className={`text-gray-300 transition-colors ${isPlaying ? 'text-[#EE7203]' : 'group-hover:text-[#EE7203]'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}