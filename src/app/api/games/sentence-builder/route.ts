import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Traducción de instrucciones por idioma
const LANGUAGE_MAP: Record<string, { langName: string; rules: string }> = {
  en: {
    langName: "English",
    rules: `
Generate ONE short, simple English sentence appropriate for A1–B2 students.
Rules:
- 5 to 10 words
- Common vocabulary
- Grammatically correct
- No commas, no quotes, no names
- Return ONLY the sentence.
`,
  },
  es: {
    langName: "Spanish",
    rules: `
Genera UNA oración corta en español, simple y adecuada para estudiantes A1–B2.
Reglas:
- 5 a 10 palabras
- Vocabulario común
- Gramáticamente correcta
- Sin comas, sin nombres propios, sin comillas
- Devuelve SOLO la oración.
`,
  },
  pt: {
    langName: "Portuguese",
    rules: `
Gere UMA frase curta em português, simples e adequada para estudantes A1–B2.
Regras:
- 5 a 10 palavras
- Vocabulário comum
- Gramática correta
- Sem vírgulas, sem nomes próprios, sem aspas
- Devolva APENAS a frase.
`,
  },
  it: {
    langName: "Italian",
    rules: `
Genera UNA frase breve in italiano, semplice e adatta a studenti A1–B2.
Regole:
- 5 a 10 parole
- Vocabolario comune
- Grammaticalmente corretta
- Niente virgole, niente nomi propri, niente virgolette
- Restituisci SOLO la frase.
`,
  },
  fr: {
    langName: "French",
    rules: `
Génère UNE phrase courte en français, simple et adaptée aux étudiants A1–B2.
Règles :
- 5 à 10 mots
- Vocabulaire courant
- Grammatiquement correcte
- Pas de virgules, pas de noms propres, pas de guillemets
- Retourne UNIQUEMENT la phrase.
`,
  },
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") || "en").toLowerCase();

    const info = LANGUAGE_MAP[lang] || LANGUAGE_MAP["en"];

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = info.rules.trim();

    const result = await model.generateContent(prompt);
    let sentence = result.response.text().trim();

    // Limpieza básica
    sentence = sentence.replace(/["“”]/g, "").trim();

    const words = sentence.split(" ").map((w) => w.trim());
    const shuffled = [...words].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      sentence,
      words,
      shuffled,
    });
  } catch (err) {
    console.error("Sentence builder error:", err);

    const fallback = "She is reading a book";
    const fallbackWords = fallback.split(" ");

    return NextResponse.json({
      sentence: fallback,
      words: fallbackWords,
      shuffled: [...fallbackWords].sort(() => Math.random() - 0.5),
    });
  }
}
