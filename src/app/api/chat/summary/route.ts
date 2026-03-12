// API SUMMARY

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { retry } from "@/lib/retry";

export const runtime = "nodejs";

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

const MODEL_ID = "gpt-5-mini";

const SUMMARY_PROMPT = `
You are a strict JSON generator for Further Campus.

You MUST write directly TO THE STUDENT (second person "you"), in a friendly and motivational tone.
Never speak about the student in third person. Never say "the student did…".
Always speak TO them: "You communicated well…", "You can improve by…".

Your ONLY task is to analyze the conversation between a student and a language tutor
and return a CLEAN JSON object addressed to the student.

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

Guidelines for writing:

• Write everything as if speaking directly to the learner.
• "feedbackSummary" → short, motivating, personal.
• "strengths" → list the things THEY did well ("You expressed…", "You used…").
• "weakPoints" → improvements THEY should focus on ("You should try…", "You often…").
• "commonMistakes" → use examples FROM THEIR MESSAGES, but correct them in second person.
• "improvementPlan" → clear and encouraging, addressed directly to the student.
• "suggestedExercises" → short actionable tasks they can do next.
• "suggestedGames" → short list of relevant practice games.

Adapt tone and difficulty to CEFR level {{LEVEL}} and target language {{LANGUAGE}}.

IMPORTANT:
• If the target language is "Spanish", ALWAYS use Rioplatense/Argentinian Spanish.
• If the target language is "Portuguese", ALWAYS use Brazilian Portuguese (PT-BR).

If you are missing information, still return a valid JSON with empty arrays/short text.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, level, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing messages[]" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transcribir conversación
    const transcript = messages
      .map((m: any) => {
        const speaker = m.role === "user" ? "Student" : "Tutor";
        return `${speaker}: ${m.content}`;
      })
      .join("\n");

    const prompt =
      SUMMARY_PROMPT.replace("{{LEVEL}}", level || "B1").replace(
        "{{LANGUAGE}}",
        language || "English"
      ) +
      "\n\n=== CONVERSATION START ===\n" +
      transcript +
      "\n=== CONVERSATION END ===";

    // Generación con retries
    const result = await retry(
      () =>
        openai.chat.completions.create({
          model: MODEL_ID,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      3,
      400
    );

    const raw = result.choices[0]?.message?.content || "";

    console.log("🔍 RAW SUMMARY RESPONSE:\n", raw);

    // Parsing robusto
    let clean: any = null;

    try {
      clean = JSON.parse(raw);
    } catch {}

    if (!clean) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          clean = JSON.parse(match[0]);
        } catch {}
      }
    }

    // Si falla → devolver summary vacío
    if (!clean) {
      console.warn("⚠️ SUMMARY INCOMPLETE: no fue posible parsear JSON");
      clean = {
        feedbackSummary: "",
        strengths: [],
        weakPoints: [],
        commonMistakes: [],
        improvementPlan: "",
        suggestedExercises: [],
        suggestedGames: [],
        incomplete: true,
      };
    }

    if (!clean.feedbackSummary) {
      clean.incomplete = true;
    }

    return new Response(JSON.stringify(clean), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Summary API error (fatal):", err);

    return new Response(
      JSON.stringify({
        feedbackSummary: "",
        strengths: [],
        weakPoints: [],
        commonMistakes: [],
        improvementPlan: "",
        suggestedExercises: [],
        suggestedGames: [],
        incomplete: true,
      }),
      { status: 200 }
    );
  }
}