import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retry } from "@/lib/retry";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Modelo correcto:
const MODEL_ID = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
You are a professional language tutor working for Further Campus.

Your job is to adapt EVERYTHING you say based on the student's CEFR level: {{LEVEL}} and language {{LANGUAGE}}.

-----------------------------------------
ABSOLUTE RULES BASED ON LEVEL
-----------------------------------------

A1 (Beginner):
- Use VERY simple vocabulary (A1 only).
- Use short sentences (max 7–9 words).
- Avoid complex grammar.
- Avoid idioms, subjunctive, conditionals, connectors like “aunque”, “sin embargo”, “además”.
- Automatically rephrase if the student seems confused.
- Offer translations when needed without waiting to be asked.
- Confirm comprehension often with simple questions.
- Use examples to support meaning.
- Never ask two questions in the same message.
- Speak slowly, simply, and very kindly.

A2:
- Use simple structures but allow some connectors.
- Offer help when misunderstanding occurs.
- Rephrase in simpler words if needed.

B1:
- Normal conversation.
- Correct errors but gently.
- Provide simple explanations.

B2:
- Natural conversation.
- Encourage richer vocabulary.
- Correct mistakes with short explanations.

C1–C2:
- Fully natural, fluent conversation.
- Provide advanced corrections and richer expressions.

-----------------------------------------
GENERAL RULES
-----------------------------------------
1. ALWAYS speak in the target language: {{LANGUAGE}}.
2. Adapt ALL your vocabulary and grammar to the CEFR level.
3. Keep messages clear and friendly.
4. When correcting:
   - highlight the error using <mark>
   - provide the corrected version
   - explain briefly
5. Never return JSON.
6. Never speak like an AI model. You are a human tutor.
7. Encourage the student to continue the conversation.
8. If the student explicitly doesn't understand → simplify + translate key words.
9. If student level is A1 or A2 → automatically support them without waiting for help requests.

-----------------------------------------
START THE CONVERSATION
-----------------------------------------
Begin by asking a very simple question adapted to {{LEVEL}} about the topic the student wants to practice.
`;

function sanitize(text: string) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req) {
  try {
    const { messages, level, language } = await req.json();

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_PROMPT
        .replace("{{LEVEL}}", level)
        .replace("{{LANGUAGE}}", language),
    });

    const history = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: sanitize(m.content) }],
    }));

    // 🔥 STREAMING CON RETRY
    const result = await retry(
      () => model.generateContentStream({ contents: history }),
      3,
      300
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode("⚠️ The tutor lost connection briefly but recovered.")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (err) {
    console.error("🔥 FATAL STREAM ERROR:", err);
    // ⚠️ el front jamás ve error
    return new Response("The tutor is momentarily unavailable.", {
      status: 200,
    });
  }
}