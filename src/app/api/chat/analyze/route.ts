import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // ⬅️ MUY IMPORTANTE

const MODEL_ID = "gpt-5-mini";

/**
 * ⚠️ NO instanciar OpenAI a nivel global
 * Esto evita que el build falle si la env no está cargada aún
 */
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
  }

  return new OpenAI({ apiKey });
}

const ANALYSIS_PROMPT = `
You are a language error detection system.

Analyze the student's message for grammatical, vocabulary, or spelling errors.

Student level: {{LEVEL}}
Target language: {{LANGUAGE}}.
IMPORTANT:
- If {{LANGUAGE}} = "Spanish", use only Rioplatense/Argentinian Spanish.
- If {{LANGUAGE}} = "Portuguese", use only Brazilian Portuguese (PT-BR).

CRITICAL RULES:
1. Only detect REAL errors that affect communication
2. Do NOT flag stylistic choices or valid alternatives
3. For A1-A2: Be more lenient, focus on major errors only
4. For B1+: Be more precise
5. Return ONLY valid JSON, no extra text

OUTPUT FORMAT (JSON only):
{
  "corrections": [
    {
      "error": "exact text with error",
      "correction": "corrected version",
      "explanation": "brief explanation in {{LANGUAGE}}",
      "position": 0
    }
  ]
}

If no errors found, return:
{
  "corrections": []
}

Student message:
{{MESSAGE}}
`;

export async function POST(req: NextRequest) {
  try {
    const { message, level, language } = await req.json();

    // 🛑 Guard clauses (evita llamadas innecesarias)
    if (!message || message.trim().length < 3) {
      return NextResponse.json({ corrections: [] });
    }

    const openai = getOpenAI(); // ⬅️ se instancia SOLO en runtime

    const prompt = ANALYSIS_PROMPT
      .replace(/{{LEVEL}}/g, level || "B1")
      .replace(/{{LANGUAGE}}/g, language || "English")
      .replace("{{MESSAGE}}", message);

    const result = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 1,
    });

    const text = result.choices[0]?.message?.content || "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("⚠️ Invalid JSON from OpenAI:", text);
      return NextResponse.json({ corrections: [] });
    }

    // 📍 Calcular posición real de cada error
    const corrections = (parsed.corrections || []).map((corr: any) => {
      const position = message
        .toLowerCase()
        .indexOf((corr.error || "").toLowerCase());

      return {
        ...corr,
        position: position >= 0 ? position : 0,
      };
    });

    return NextResponse.json({ corrections });
  } catch (err) {
    console.error("🔥 Error analyzing corrections:", err);
    return NextResponse.json({ corrections: [] });
  }
}
