import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);
const MODEL_ID = "gemini-2.5-flash";

const ANALYSIS_PROMPT = `
You are a language error detection system.

Analyze the student's message for grammatical, vocabulary, or spelling errors.

Student level: {{LEVEL}}
Target language: {{LANGUAGE}}

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

    if (!message || message.trim().length < 3) {
      return NextResponse.json({ corrections: [] });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const prompt = ANALYSIS_PROMPT
      .replace(/{{LEVEL}}/g, level)
      .replace(/{{LANGUAGE}}/g, language)
      .replace("{{MESSAGE}}", message);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Si falla el parsing, devolver sin correcciones
      return NextResponse.json({ corrections: [] });
    }

    // Calcular posiciones de cada error en el mensaje original
    const corrections = (parsed.corrections || []).map((corr: any) => {
      const position = message.toLowerCase().indexOf(corr.error.toLowerCase());
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