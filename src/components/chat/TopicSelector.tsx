"use client";

import { useState } from "react";
import { FiX, FiChevronRight, FiRefreshCw } from "react-icons/fi";

export interface Topic {
  id: string;
  emoji: string;
  label: string;
  labelEs: string;
  description: string;
  descriptionEs: string;
  color: string;
  accent: string;
  systemPrompt: string;
}

export const TOPICS: Topic[] = [
  {
    id: "travel",
    emoji: "✈️",
    label: "Travel & Tourism",
    labelEs: "Viajes y turismo",
    description: "Flights, hotels, adventures abroad",
    descriptionEs: "Vuelos, hoteles, aventuras en el exterior",
    color: "from-sky-500 to-blue-600",
    accent: "#0ea5e9",
    systemPrompt: `TOPIC CONTEXT: The conversation is about TRAVEL & TOURISM.
Subtopics to naturally explore: airports, flights, hotels, tourist attractions, cultural differences, travel tips, packing, visas, local food, transportation, booking trips, travel stories, dream destinations.
Start by asking where the student has traveled or where they dream of going.`,
  },
  {
    id: "work",
    emoji: "💼",
    label: "Work & Interviews",
    labelEs: "Trabajo y entrevistas",
    description: "Career, job hunting, professional life",
    descriptionEs: "Carrera, búsqueda laboral, vida profesional",
    color: "from-slate-600 to-zinc-700",
    accent: "#64748b",
    systemPrompt: `TOPIC CONTEXT: The conversation is about WORK & JOB INTERVIEWS.
Subtopics to naturally explore: job interviews, CV/resume, workplace situations, career goals, professional skills, office culture, remote work, promotions, colleagues, work-life balance, networking, salary negotiation.
Start by asking about their current job or career goals.`,
  },
  {
    id: "food",
    emoji: "🍽️",
    label: "Food & Restaurants",
    labelEs: "Comida y restaurantes",
    description: "Recipes, dining out, cuisines worldwide",
    descriptionEs: "Recetas, salir a comer, cocinas del mundo",
    color: "from-orange-500 to-red-500",
    accent: "#f97316",
    systemPrompt: `TOPIC CONTEXT: The conversation is about FOOD & RESTAURANTS.
Subtopics to naturally explore: favorite dishes, restaurants, cooking at home, recipes, food from different cultures, dietary restrictions, ordering food, describing tastes and textures, food markets, street food, fine dining.
Start by asking about their favorite food or a recent meal they enjoyed.`,
  },
  {
    id: "sports",
    emoji: "⚽",
    label: "Sports & Fitness",
    labelEs: "Deportes y fitness",
    description: "Teams, training, healthy lifestyle",
    descriptionEs: "Equipos, entrenamiento, estilo de vida saludable",
    color: "from-green-500 to-emerald-600",
    accent: "#22c55e",
    systemPrompt: `TOPIC CONTEXT: The conversation is about SPORTS & FITNESS.
Subtopics to naturally explore: favorite sports, teams, athletes, gym routines, healthy habits, competitions, sports news, playing sports, watching games, injuries, motivation, fitness goals.
Start by asking what sports they play or follow.`,
  },
  {
    id: "tech",
    emoji: "💻",
    label: "Technology",
    labelEs: "Tecnología",
    description: "Gadgets, AI, digital life",
    descriptionEs: "Gadgets, IA, vida digital",
    color: "from-violet-600 to-purple-700",
    accent: "#7c3aed",
    systemPrompt: `TOPIC CONTEXT: The conversation is about TECHNOLOGY.
Subtopics to naturally explore: smartphones, apps, social media, artificial intelligence, gaming, working with technology, tech news, cybersecurity, streaming services, online shopping, digital habits, future of tech.
Start by asking about their favorite apps or how they use technology daily.`,
  },
  {
    id: "culture",
    emoji: "🎭",
    label: "Culture & Arts",
    labelEs: "Cultura y arte",
    description: "Movies, music, books, creativity",
    descriptionEs: "Películas, música, libros, creatividad",
    color: "from-rose-500 to-pink-600",
    accent: "#f43f5e",
    systemPrompt: `TOPIC CONTEXT: The conversation is about CULTURE & ARTS.
Subtopics to naturally explore: movies, music genres, favorite artists/bands, books, museums, theater, photography, painting, cultural events, festivals, local traditions, creative hobbies.
Start by asking about their favorite movie, song, or book recently.`,
  },
  {
    id: "daily",
    emoji: "☀️",
    label: "Daily Life",
    labelEs: "Vida cotidiana",
    description: "Routines, family, hobbies, weekends",
    descriptionEs: "Rutinas, familia, hobbies, fines de semana",
    color: "from-amber-400 to-yellow-500",
    accent: "#f59e0b",
    systemPrompt: `TOPIC CONTEXT: The conversation is about DAILY LIFE & ROUTINES.
Subtopics to naturally explore: morning/evening routines, family, friends, hobbies, weekends, shopping, household chores, neighborhood, pets, local community, relaxing activities, free time.
Start by asking about their typical day or weekend plans.`,
  },
  {
    id: "business",
    emoji: "📈",
    label: "Business",
    labelEs: "Negocios",
    description: "Entrepreneurship, markets, leadership",
    descriptionEs: "Emprendimiento, mercados, liderazgo",
    color: "from-teal-500 to-cyan-600",
    accent: "#14b8a6",
    systemPrompt: `TOPIC CONTEXT: The conversation is about BUSINESS.
Subtopics to naturally explore: entrepreneurship, startups, marketing, leadership, business strategies, market trends, investing, presentations, client relationships, company culture, e-commerce, business news.
Start by asking if they run a business or work in a company they find interesting.`,
  },
];

interface TopicSelectorProps {
  language: string;
  onSelect: (topic: Topic) => void;
  currentTopic?: Topic | null;
  mode: "initial" | "change"; // initial = pantalla completa, change = modal
  onClose?: () => void;
}

export default function TopicSelector({
  language,
  onSelect,
  currentTopic,
  mode,
  onClose,
}: TopicSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isEs = ["es", "spanish"].includes(language?.toLowerCase());

  const content = (
    <div className="relative w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#EE7203] mb-1">
              {isEs ? "Elige una temática" : "Choose a topic"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0C212D] leading-tight">
              {isEs ? "¿Sobre qué querés practicar hoy?" : "What do you want to practice today?"}
            </h2>
            {currentTopic && (
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                <FiRefreshCw size={12} />
                {isEs ? `Actual: ${currentTopic.labelEs}` : `Current: ${currentTopic.label}`}
              </p>
            )}
          </div>
          {mode === "change" && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of topics */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOPICS.map((topic, index) => {
            const isActive = currentTopic?.id === topic.id;
            const isHovered = hoveredId === topic.id;

            return (
              <button
                key={topic.id}
                onClick={() => onSelect(topic)}
                onMouseEnter={() => setHoveredId(topic.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative group text-left rounded-2xl overflow-hidden transition-all duration-300 active:scale-95"
                style={{
                  animationDelay: `${index * 50}ms`,
                  boxShadow: isActive
                    ? `0 0 0 2px ${topic.accent}, 0 8px 24px ${topic.accent}30`
                    : isHovered
                    ? `0 8px 24px ${topic.accent}25`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                {/* Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-0 transition-opacity duration-300 ${
                    isActive ? "opacity-100" : isHovered ? "opacity-90" : ""
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-white transition-opacity duration-300 ${
                    isActive || isHovered ? "opacity-0" : "opacity-100"
                  }`}
                />
                <div className="absolute inset-0 border-2 border-gray-100 rounded-2xl transition-colors duration-300 group-hover:border-transparent" />

                {/* Content */}
                <div className="relative p-4">
                  <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110 inline-block">
                    {topic.emoji}
                  </div>
                  <p
                    className={`font-black text-sm leading-tight mb-1 transition-colors duration-300 ${
                      isActive || isHovered ? "text-white" : "text-[#0C212D]"
                    }`}
                  >
                    {isEs ? topic.labelEs : topic.label}
                  </p>
                  <p
                    className={`text-xs leading-snug transition-colors duration-300 ${
                      isActive || isHovered ? "text-white/75" : "text-gray-400"
                    }`}
                  >
                    {isEs ? topic.descriptionEs : topic.description}
                  </p>

                  {isActive && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] text-white/80 font-bold uppercase tracking-wide">
                        {isEs ? "Activo" : "Active"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow hint on hover */}
                <div
                  className={`absolute bottom-3 right-3 transition-all duration-300 ${
                    isHovered || isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  }`}
                >
                  <FiChevronRight
                    size={16}
                    className={isActive || isHovered ? "text-white" : "text-gray-400"}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // MODO INICIAL: ocupa toda la pantalla del chat
  if (mode === "initial") {
    return (
      <div className="absolute inset-0 bg-white z-30 flex flex-col">
        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203]" />
        {content}
      </div>
    );
  }

  // MODO CHANGE: modal overlay
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] flex-shrink-0" />
        {content}
      </div>
    </div>
  );
}