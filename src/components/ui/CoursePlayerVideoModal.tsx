"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, PlayCircle, CheckCircle2, BookOpen } from "lucide-react";

// 🎨 Paleta corporativa
const COLORS = {
  darkBlue: "#0C212D",
  orange: "#EE7203",
  red: "#FF3816",
  mediumBlue: "#112C3E",
};

interface CoursePlayerVideoModalProps {
  videoUrl?: string;
  courseTitle?: string; // 👈 Título del curso actual
  autoShow?: boolean;
  videoType?: "youtube" | "vimeo" | "direct";
}

export default function CoursePlayerVideoModal({
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // 👈 Reemplaza con tu video
  courseTitle = "Academic Material",
  autoShow = true,
  videoType = "youtube",
}: CoursePlayerVideoModalProps) {
  const {
    hasSeenCoursePlayerVideo,
    markCoursePlayerVideoAsSeen,
    loadingCoursePlayerVideoStatus,
    user,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Mostrar modal automáticamente si no ha visto el video
  useEffect(() => {
    if (!loadingCoursePlayerVideoStatus && user && !hasSeenCoursePlayerVideo && autoShow) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loadingCoursePlayerVideoStatus, hasSeenCoursePlayerVideo, user, autoShow]);

  const handleClose = async () => {
    setIsClosing(true);

    // Siempre marcar como visto al cerrar
    if (!hasSeenCoursePlayerVideo) {
      await markCoursePlayerVideoAsSeen();
    }

    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleSkip = async () => {
    await markCoursePlayerVideoAsSeen();
    handleClose();
  };

  // Marcar como visto después de 30 segundos
  useEffect(() => {
    if (isOpen && !hasSeenCoursePlayerVideo) {
      const timer = setTimeout(() => {
        setVideoEnded(true);
      }, 53000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSeenCoursePlayerVideo]);

  // Función para obtener la URL de embed correcta
  const getEmbedUrl = () => {
    if (videoType === "youtube") {
      if (videoUrl.includes("youtube.com/watch?v=")) {
        const videoId = new URL(videoUrl).searchParams.get("v");
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
      }
      if (videoUrl.includes("youtu.be/")) {
        const videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1`;
      }
      return `${videoUrl}?enablejsapi=1&rel=0&modestbranding=1`;
    }

    if (videoType === "vimeo") {
      if (videoUrl.includes("vimeo.com/")) {
        const videoId = videoUrl.split("vimeo.com/")[1].split("?")[0];
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
      }
      return videoUrl;
    }

    return videoUrl;
  };

  if (!isOpen || loadingCoursePlayerVideoStatus) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundColor: `${COLORS.darkBlue}f0`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          maxHeight: "90vh",
          background: "white",
          boxShadow: `0 20px 40px ${COLORS.darkBlue}50`,
        }}
      >
        {/* Header con gradiente corporativo */}
        <div
          className="relative px-8 py-5 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${COLORS.darkBlue} 0%, ${COLORS.mediumBlue} 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: COLORS.orange,
              }}
            >
              <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {courseTitle}
              </h2>
              <p className="text-sm text-gray-300 mt-0.5">
                Learn how to navigate and make the most of this academic material
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl transition-colors text-white hover:bg-white/10"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
            }}
            aria-label="Close"
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black" style={{ paddingBottom: "56.25%" }}>
          {videoType === "direct" ? (
            <video
              src={getEmbedUrl()}
              className="absolute inset-0 w-full h-full"
              controls
              onEnded={handleVideoEnd}
            />
          ) : (
            <iframe
              src={getEmbedUrl()}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Academic material video"
              
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="px-8 py-5 flex items-center justify-between"
          style={{
            background: "#f9fafb",
            borderTop: `2px solid ${COLORS.orange}`,
          }}
        >
          <div className="flex items-center gap-3 text-sm">
            {videoEnded ? (
              <>
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${COLORS.orange}15` }}
                >
                  <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.orange }} />
                </div>
                <span className="font-semibold" style={{ color: COLORS.darkBlue }}>
                  Video completed successfully!

                </span>
              </>
            ) : (
              <span className="font-medium text-gray-700">
                Discover all the features of the academic material

              </span>
            )}
          </div>

          <div className="flex gap-3">
            {!videoEnded && (
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  color: COLORS.darkBlue,
                  background: "transparent",
                  border: `2px solid ${COLORS.darkBlue}30`,
                }}
              >
                Skip for now

              </button>
            )}

            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
              style={{
                background: videoEnded
                  ? `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.red} 100%)`
                  : COLORS.darkBlue,
              }}
            >
              {videoEnded ? "Let’s get started! 🚀" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}