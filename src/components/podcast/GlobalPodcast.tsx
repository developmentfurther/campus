"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic2, Maximize2, Minimize2, GripVertical } from 'lucide-react';

import { useDashboardUI } from '@/stores/useDashboardUI';

export const GlobalPodcast = () => {
  const { currentPodcastUrl, isPlayerVisible, closePlayer } = useDashboardUI();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Posición inicial
  useEffect(() => {
    const setInitialPosition = () => {
      if (isMobile) {
        // En mobile: centrado en la parte inferior
        const width = isExpanded ? Math.min(window.innerWidth - 32, 400) : 320;
        setPosition({ 
          x: (window.innerWidth - width) / 2, 
          y: window.innerHeight - (isExpanded ? 300 : 180) - 20 
        });
      } else {
        // En desktop: esquina inferior derecha
        const initialX = window.innerWidth - (isExpanded ? 420 : 340);
        const initialY = window.innerHeight - (isExpanded ? 300 : 180);
        setPosition({ x: initialX, y: initialY });
      }
    };

    setInitialPosition();
  }, [isMobile]);

  // Reposicionar cuando cambia el tamaño expandido
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      const width = isMobile ? Math.min(window.innerWidth - 32, 400) : (isExpanded ? 400 : 320);
      const height = isExpanded ? 280 : 160;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      
      setPosition(prev => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(prev.y, maxY)
      }));
    }
  }, [isExpanded, isMobile]);

  // Manejar inicio de drag (mouse + touch)
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!e.target.closest('.drag-handle')) return;
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.target.closest('.drag-handle')) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  // Efectos para manejar el movimiento
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;

      const width = isMobile ? Math.min(window.innerWidth - 32, 400) : (isExpanded ? 400 : 320);
      const height = isExpanded ? 280 : 160;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, isExpanded, isMobile]);

  if (!isPlayerVisible || !currentPodcastUrl) return null;

  const width = isMobile ? Math.min(window.innerWidth - 32, 400) : (isExpanded ? 400 : 320);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`fixed z-[999] ${
        isDragging ? 'cursor-grabbing select-none' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        transition: isDragging ? 'none' : 'width 0.3s ease',
        touchAction: 'none', // Previene comportamientos por defecto en touch
      }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#EE7203]/30 overflow-hidden">
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203]" />

        {/* Header draggable */}
        <div className="drag-handle cursor-grab active:cursor-grabbing bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/10 px-3 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2 pointer-events-none">
            <GripVertical size={16} className="text-gray-400" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-md">
              <Mic2 size={14} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#0C212D] leading-tight truncate">
                Further Records
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                Playing now
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {/* Botón expandir/contraer - oculto en mobile si está expandido a fullwidth */}
            {!isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white text-gray-600 transition-colors"
                aria-label={isExpanded ? "Contraer" : "Expandir"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}

            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePlayer();
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/50 hover:bg-red-500 hover:text-white text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Contenido del iframe */}
        <div className="p-3 pointer-events-auto">
          <div className="overflow-hidden rounded-xl bg-gray-50 shadow-inner border border-gray-200">
            <iframe
              src={`${currentPodcastUrl}?utm_source=generator`}
              width="100%"
              height={isExpanded ? "352" : "152"}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full transition-all duration-300"
              style={{ border: 'none' }}
            />
          </div>
        </div>

        {/* Overlay durante el drag */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#EE7203]/5 pointer-events-none rounded-2xl" />
        )}
      </div>
    </div>
  );
}