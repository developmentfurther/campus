// /app/api/games/hangman/route.ts

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    // 🔹 Leer idioma desde query (?lang=es|en|pt|fr|it)
    const { searchParams } = new URL(req.url);
    const rawLang = (searchParams.get("lang") || "en").toLowerCase();

    const SUPPORTED = ["en", "es", "pt", "fr", "it"] as const;
    type Lang = (typeof SUPPORTED)[number];

    const lang: Lang = SUPPORTED.includes(rawLang as Lang)
      ? (rawLang as Lang)
      : "en";

    const model = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
You are generating one word for a Hangman game.

Target language (student language): ${lang}

Requirements:
- Return only ONE word
- Word must be in the target language
- ONLY alphabetic characters of that language
- Length between 5 and 12 letters
- No explanation, no quotes, no punctuation.

Languages mapping:
- "en" → English
- "es" → Spanish
- "pt" → Portuguese
- "fr" → French
- "it" → Italian

Return ONLY the word. Nothing else.
    `.trim();

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data: any = await resp.json();
    const raw: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 1️⃣ Extraer una palabra válida (permitimos letras con acentos)
    const candidates =
      raw
        .toLowerCase()
        .match(/[a-záéíóúüñàèìòùâêîôûçœæãõ]+/gi) || [];

    let cleaned =
      candidates.find((w) => w.length >= 5 && w.length <= 12) || "";

    // 2️⃣ Fallback interno por idioma
    if (!cleaned) {
      const FALLBACK: Record<Lang, string[]> = {
        en: ["academy", "teacher", "learning", "english", "clarity", "practice"],
        es: ["estudio", "clases", "idiomas", "aprendo", "docente", "alumno"],
        pt: ["estudar", "idiomas", "professor", "aprendo", "alunos", "curso"],
        fr: ["etudier", "langues", "professeur", "cours", "eleves", "oral"],
        it: ["studiare", "lingue", "lezioni", "corso", "alunno", "parlare"],
      };

      const pool = FALLBACK[lang] || FALLBACK["en"];
      cleaned = pool[Math.floor(Math.random() * pool.length)];
      console.warn("⚠️ [Hangman] Using fallback word:", { lang, cleaned });
    }

    return Response.json({ word: cleaned });
  } catch (err: any) {
    console.error("❌ Hangman API Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
