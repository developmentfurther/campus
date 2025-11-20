import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get("lang") || "en").toLowerCase();

    const MIN = 5;
    const MAX = 12;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Generate ONE random word for a word scramble game.

Rules:
- Language of the word: ${lang}
- Word must have between ${MIN} and ${MAX} letters
- It must be a common real word
- No names, no slang, no verbs in conjugation (give dictionary base form if possible)
- No explanations
- Output ONLY the word in lowercase.
    `;

    const result = await model.generateContent(prompt);

    let text = result.response.text().trim().toLowerCase();

    // Limpieza fuerte
    text = text.replace(/[^a-záéíóúüñçàèìòùäëïöüœæ]/gi, ""); // soportar idiomas

    // Validar largo
    if (text.length < MIN || text.length > MAX) {
      throw new Error("AI returned invalid length");
    }

    return NextResponse.json({ word: text });
  } catch (err) {
    console.error("❌ WordScramble Endpoint Error:", err);

    const FALLBACK = {
      en: ["academy", "teacher", "learning", "practice", "student", "grammar"],
      es: ["idiomas", "estudio", "practica", "clases", "escuela", "verbos"],
      pt: ["idiomas", "estudar", "pratica", "escola", "alunos", "linguas"],
      it: ["studio", "imparare", "scuola", "lingua", "grammatica", "verbi"],
      fr: ["langues", "ecole", "etudier", "grammaire", "verbes", "cours"]
    };

    const lang = new URL(req.url).searchParams.get("lang") || "en";
    const fallbackList = FALLBACK[lang] || FALLBACK["en"];

    const word = fallbackList[Math.floor(Math.random() * fallbackList.length)];

    return NextResponse.json({ word });
  }
}
