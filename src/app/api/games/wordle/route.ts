import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Diccionarios fallback por idioma
const FALLBACK: Record<string, string[]> = {
  en: ["apple", "light", "river", "stone", "friend"],
  es: ["casa", "perro", "noche", "verde", "flor"],
  pt: ["casa", "livro", "carro", "amigo", "verde"],
  it: ["cane", "gatto", "notte", "casa", "verde"],
  fr: ["pomme", "chien", "maison", "fleur", "rouge"],
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const min = Number(url.searchParams.get("min") || 3);
    const max = Number(url.searchParams.get("max") || 10);
    const lang = (url.searchParams.get("lang") || "en").toLowerCase();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt por idioma
    const PROMPTS: Record<string, string> = {
      en: `
Generate ONE random English word that:
- is between ${min} and ${max} letters long
- is a common dictionary word
- only alphabetic characters
- no proper nouns
Respond ONLY with the word in lowercase.
      `,
      es: `
Genera UNA sola palabra en español que:
- tenga entre ${min} y ${max} letras
- sea común y estándar del idioma
- solo caracteres alfabéticos
- no sea un nombre propio
Responde SOLO con la palabra en minúscula.
      `,
      pt: `
Gere UMA única palavra em português que:
- tenha entre ${min} e ${max} letras
- seja comum no idioma
- apenas caracteres alfabéticos
- não seja nome próprio
Responda SOMENTE com a palavra em minúsculas.
      `,
      it: `
Genera UNA parola italiana che:
- abbia tra ${min} e ${max} lettere
- sia comune nella lingua
- contenga solo lettere alfabetiche
- non sia un nome proprio
Rispondi SOLO con la parola in minuscolo.
      `,
      fr: `
Génère UN mot français qui:
- contient entre ${min} et ${max} lettres
- soit un mot courant
- uniquement lettres alphabétiques
- pas de noms propres
Réponds UNIQUEMENT avec le mot en minuscules.
      `,
    };

    const prompt = PROMPTS[lang] || PROMPTS["en"];

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().toLowerCase();

    // Filtro de caracteres según idioma
    const regexByLang: Record<string, RegExp> = {
      en: /[^a-z]/g,
      es: /[^a-záéíóúüñ]/gi,
      pt: /[^a-záéíóúâêôãõç]/gi,
      it: /[^a-zàèéìíîòóùú]/gi,
      fr: /[^a-zàâçéèêëîïôûùüÿœ]/gi,
    };

    text = text.replace(regexByLang[lang], "");

    if (text.length < min || text.length > max) {
      throw new Error("Invalid word returned");
    }

    return NextResponse.json({ word: text });
  } catch (err) {
    console.error("❌ Wordle endpoint error:", err);

    const fallbackWords =
      FALLBACK[(new URL(req.url).searchParams.get("lang") || "en")] ||
      FALLBACK["en"];

    const fallbackWord =
      fallbackWords[Math.floor(Math.random() * fallbackWords.length)];

    return NextResponse.json({ word: fallbackWord });
  }
}
