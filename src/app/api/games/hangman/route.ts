// /app/api/games/hangman/route.ts
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const model = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
Generate ONE English word for a hangman game.

Requirements:
- Only ONE word
- ONLY alphabetic characters
- 5 to 12 letters
- No explanation, no quotes, no punctuation.
Return ONLY the word.
`;

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

    // 1️⃣ Extraer primera palabra alfanumérica válida
    let cleaned = raw
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .find((w) => w.length >= 5 && w.length <= 12);

    // 2️⃣ Si no vino válida → pedir fallback interno
    if (!cleaned) {
      const FALLBACK = [
        "academy",
        "teacher",
        "learning",
        "english",
        "clarity",
        "further",
        "practice",
        "student",
      ];
      cleaned = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      console.warn("⚠️ Using fallback word:", cleaned);
    }

    return Response.json({ word: cleaned });
  } catch (err: any) {
    console.error("❌ Hangman API Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
