export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const model = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
Return EXACTLY this JSON structure:

{
  "items": [
    {
      "emojis": "🧊🔥",
      "answers": ["idiom"],
      "hint": "Spanish hint",
      "explain": "Short Spanish explanation"
    },
    {
      "emojis": "😬💊",
      "answers": ["idiom"],
      "hint": "Spanish hint",
      "explain": "Short Spanish explanation"
    },
    {
      "emojis": "🔨🎯",
      "answers": ["idiom"],
      "hint": "Spanish hint",
      "explain": "Short Spanish explanation"
    }
  ]
}

STRICT RULES:
- Return ONLY JSON.
- NO markdown.
- NO backticks.
`;

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const data: any = await resp.json();

    // SI Falla la API de Gemini
    if (data?.error) {
      console.warn("⚠️ GEMINI API ERROR:", data.error);

      // fallback seguro
      return Response.json({
        items: [
          {
            emojis: "🧊🔥",
            answers: ["break the ice"],
            hint: "Iniciar una conversación.",
            explain: "Usado para empezar una conversación en situación tensa.",
          },
          {
            emojis: "😬💊",
            answers: ["bite the bullet"],
            hint: "Afrontar algo difícil",
            explain: "Significa enfrentar una situación dura con valentía.",
          },
          {
            emojis: "🔨🎯",
            answers: ["hit the nail on the head"],
            hint: "Acertar exactamente",
            explain: "Decir algo que da en el punto exacto.",
          },
        ],
      });
    }

    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 🔥 Log útil
    console.log("RAW FROM GEMINI:", raw);

    if (!raw) {
      return Response.json({ error: "Empty response from AI" }, { status: 500 });
    }

    /* -------------------------------------
      Limpieza anti-markdown
    ------------------------------------- */
    raw = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // El JSON puede venir rodeado de texto → extraemos la parte entre {}
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("❌ No JSON found:", raw);
      return Response.json(
        { error: "AI JSON missing braces", raw },
        { status: 500 }
      );
    }

    const jsonText = raw.slice(start, end + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", jsonText);
      return Response.json(
        { error: "Invalid AI JSON", raw, jsonText },
        { status: 500 }
      );
    }

    // Asegurar EXACTAMENTE 3
    parsed.items = parsed.items?.slice(0, 3) || [];

    return Response.json(parsed);
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}