import OpenAI from "openai";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const rawLang = (searchParams.get("lang") || "en").toLowerCase();

    const SUPPORTED = ["en", "es", "pt", "fr", "it"] as const;
    type Lang = (typeof SUPPORTED)[number];
    const lang: Lang = SUPPORTED.includes(rawLang as Lang) ? (rawLang as Lang) : "en";

    const openai = new OpenAI({ apiKey });

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      max_tokens: 20,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "";

    const candidates = raw.toLowerCase().match(/[a-záéíóúüñàèìòùâêîôûçœæãõ]+/gi) || [];
    let cleaned = candidates.find((w) => w.length >= 5 && w.length <= 12) || "";

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