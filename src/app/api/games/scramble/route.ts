// /app/api/games/scramble/route.ts

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
Generate ONE English word for a word scramble game.

Rules:
- Only one word
- 5 to 12 letters
- No spaces
- No explanation
- Output ONLY the word in lowercase.
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

    // limpiar
    let word =
      raw
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .find((w) => w.length >= 5 && w.length <= 12) || "";

    // fallback
    if (!word) {
      const FALLBACK = [
        "academy",
        "teacher",
        "learning",
        "english",
        "practice",
        "student",
        "language",
      ];
      word = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      console.warn("⚠️ Using fallback word for WordScramble:", word);
    }

    return Response.json({ word });
  } catch (err: any) {
    console.error("❌ Scramble API Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
