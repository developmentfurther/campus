import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_ID = "gpt-4o-mini";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
  }

  return new OpenAI({ apiKey });
}

const ANALYSIS_PROMPT = `
You are an expert language error detection system for language learners.

Analyze the student's message for grammatical, vocabulary, or spelling errors.

Student level: {{LEVEL}}
Target language: {{LANGUAGE}}

IMPORTANT REGIONAL VARIANTS:
- If {{LANGUAGE}} = "Spanish", use ONLY Rioplatense/Argentinian Spanish conventions
- If {{LANGUAGE}} = "Portuguese", use ONLY Brazilian Portuguese (PT-BR) conventions

CRITICAL DETECTION RULES:
1. ONLY flag ACTUAL errors that impede clear communication
2. DO NOT flag:
   - Valid colloquialisms or informal expressions
   - Stylistic choices (both options are correct)
   - Minor punctuation unless it creates ambiguity
   - Regional variants that are correct in context
   - Typos in proper nouns or names

3. LEVEL-BASED STRICTNESS:
   - A1-A2: VERY lenient - only major errors (wrong verb tense, missing words, severe grammar)
   - B1: Moderate - focus on common mistakes and clarity
   - B2: Standard - catch grammar and vocabulary issues
   - C1-C2: Strict - high standards for precision

4. For each error, provide:
   - The EXACT text as it appears (preserve capitalization, spacing)
   - A natural correction (not overly formal unless needed)
   - A brief, helpful explanation in the target language

5. If the message is perfectly fine or has no significant errors, return empty array

OUTPUT FORMAT (STRICT JSON ONLY - NO MARKDOWN, NO EXTRA TEXT):
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

    // Guard clauses
    if (!message || message.trim().length < 3) {
      return NextResponse.json({ corrections: [] });
    }

    // Evitar análisis de mensajes muy cortos o saludos comunes
    const commonPhrases = [
      /^(hi|hello|hey|hola|oi|olá|ciao|salut)!?$/i,
      /^(bye|goodbye|adiós|tchau|ciao|au revoir)!?$/i,
      /^(thanks|thank you|gracias|obrigado|grazie|merci)!?$/i,
      /^(yes|no|si|não|oui|non)!?$/i
    ];

    if (commonPhrases.some(regex => regex.test(message.trim()))) {
      return NextResponse.json({ corrections: [] });
    }

    const openai = getOpenAI();

    const prompt = ANALYSIS_PROMPT
      .replace(/{{LEVEL}}/g, level || "B1")
      .replace(/{{LANGUAGE}}/g, language || "English")
      .replace("{{MESSAGE}}", message);

    const result = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Más determinista para análisis consistente
      max_tokens: 600
    });

    const text = result.choices[0]?.message?.content || "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("⚠️ Invalid JSON from OpenAI:", text);
      return NextResponse.json({ corrections: [] });
    }

    // Calcular posición real de cada error y validar
    const corrections = (parsed.corrections || [])
      .map((corr: any) => {
        const errorLower = (corr.error || "").toLowerCase().trim();
        const messageLower = message.toLowerCase();
        
        const position = messageLower.indexOf(errorLower);

        // Si no encontramos el error exacto, intentar búsqueda más flexible
        if (position === -1) {
          console.warn(`⚠️ Error not found in message: "${corr.error}"`);
          return null;
        }

        return {
          ...corr,
          position: position >= 0 ? position : 0,
        };
      })
      .filter(Boolean); // Remover nulls

    return NextResponse.json({ corrections });
  } catch (err) {
    console.error("🔥 Error analyzing corrections:", err);
    return NextResponse.json({ corrections: [] });
  }
}