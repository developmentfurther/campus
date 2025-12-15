// /lib/games/idioms.ts

export type IdiomItem = {
  emojis: string;
  answers: string[];
  hint?: string;
  explain?: string;
};

// =======================================================
// 🇺🇸 ENGLISH BANK
// =======================================================
export const IDIOMS_EN = [
  { emojis: "🌧️🐱🐶", answers: ["raining cats and dogs"], hint: "Heavy rain", explain: "Very strong rain." },
  { emojis: "🧊😄", answers: ["break the ice"], hint: "Start talking", explain: "Start a conversation." },
  { emojis: "🧁🍰", answers: ["piece of cake"], hint: "Very easy", explain: "Something very simple." },
];

// =======================================================
// 🇪🇸 SPANISH IDIOMS
// =======================================================
export const IDIOMS_ES = [
  { emojis: "🧊🤝", answers: ["romper el hielo"], hint: "Empezar charla", explain: "Iniciar una conversación." },
  { emojis: "🐶🩸", answers: ["buscarle tres pies al gato"], hint: "Complicar", explain: "Complicar algo innecesariamente." },
  { emojis: "🔥🧉", answers: ["estar al horno"], hint: "Problemas", explain: "Estar en una situación difícil." },
];

// =======================================================
// 🇵🇹 PORTUGUESE
// =======================================================
export const IDIOMS_PT = [
  { emojis: "🧊🤝", answers: ["quebrar o gelo"], hint: "Iniciar conversa", explain: "Começar um diálogo." },
  { emojis: "🧠💡", answers: ["dar um branco"], hint: "Esquecer", explain: "Ter um apagão mental." },
  { emojis: "😡☕", answers: ["ficar de cabeça quente"], hint: "Raiva", explain: "Estar muito irritado." },
];

// =======================================================
// 🇮🇹 ITALIAN
// =======================================================
export const IDIOMS_IT = [
  { emojis: "🧊🤝", answers: ["rompere il ghiaccio"], hint: "Iniziare", explain: "Sciogliere la tensione." },
  { emojis: "🧠⚡", answers: ["avere un colpo di genio"], hint: "Idea", explain: "Avere una buona intuizione." },
  { emojis: "💧🀄", answers: ["essere al verde"], hint: "Senza soldi", explain: "Non avere soldi." },
];

// =======================================================
// 🇫🇷 FRENCH
// =======================================================
export const IDIOMS_FR = [
  { emojis: "🧊🤝", answers: ["briser la glace"], hint: "Commencer", explain: "Démarrer une conversation." },
  { emojis: "🧠⚡", answers: ["avoir un déclic"], hint: "Comprendre", explain: "Sudden realization." },
  { emojis: "🛏️💤", answers: ["faire la grasse matinée"], hint: "Dormir mucho", explain: "Dormir jusqu'à tard." },
];

// =======================================================
// 🌍 ACCESSOR
// =======================================================
export function getIdiomsBank(lang: string): IdiomItem[] {
  switch (lang.toLowerCase()) {
    case "es": return IDIOMS_ES;
    case "pt": return IDIOMS_PT;
    case "it": return IDIOMS_IT;
    case "fr": return IDIOMS_FR;
    default:   return IDIOMS_EN;
  }
}