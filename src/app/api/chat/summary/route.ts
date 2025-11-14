import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const MODEL_ID = "gemini-2.5-flash";

const SUMMARY_PROMPT = `
You are a strict JSON generator for Further Academy.

Your ONLY task is to analyze the conversation between a student and a language tutor
and return a CLEAN JSON object.

Do NOT output anything that is not JSON.
No markdown, no commentary, no intro, no text before, no text after.

The JSON MUST follow this exact structure:

{
  "feedbackSummary": "...",
  "strengths": ["..."],
  "weakPoints": ["..."],
  "commonMistakes": [
    {
      "error": "...",
      "correction": "...",
      "explanation": "..."
    }
  ],
  "improvementPlan": "...",
  "suggestedExercises": ["..."],
  "suggestedGames": ["..."]
}

Adapt everything to CEFR level {{LEVEL}} and target language {{LANGUAGE}}.
If you are missing information, still return a valid JSON with empty arrays/short text.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, level, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing messages[]" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    // 🔹 Transcribimos el chat a texto plano
    const transcript = messages
      .map((m: any) => {
        const speaker = m.role === "user" ? "Student" : "Tutor";
        return `${speaker}: ${m.content}`;
      })
      .join("\n");

    const prompt =
      SUMMARY_PROMPT
        .replace("{{LEVEL}}", level || "B1")
        .replace("{{LANGUAGE}}", language || "English") +
      "\n\n=== CONVERSATION START ===\n" +
      transcript +
      "\n=== CONVERSATION END ===";

    // 🔥 Llamada simple: un solo prompt string
    const result = await model.generateContent(prompt);
    const raw = result.response.text() || "";

    console.log("🔍 RAW SUMMARY RESPONSE:\n", raw);

    // -------------------------
    // Parsing robusto de JSON
    // -------------------------
    let clean: any = null;

    try {
      clean = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          clean = JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
    }

    if (!clean) {
      clean = {
        feedbackSummary: "Summary parsing failed",
        strengths: [],
        weakPoints: [],
        commonMistakes: [],
        improvementPlan: "",
        suggestedExercises: [],
        suggestedGames: [],
      };
    }

    return new Response(JSON.stringify(clean), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Summary API error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
