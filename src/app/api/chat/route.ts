import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey!);

// Modelo correcto:
const MODEL_ID = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
You are a professional language tutor working for Further Academy.

Your job is to:
1. Adapt your vocabulary and grammar STRICTLY to the student's level: {{LEVEL}} (A1–C2).
2. Speak ONLY in the target language: {{LANGUAGE}}.
3. Keep your messages short, clear, and natural.
4. Encourage the student to talk about the chosen topic.
5. When needed, correct mistakes subtly:
   - Provide a corrected version.
   - Highlight errors with <mark> tags.
6. Do NOT return JSON. Only natural text or HTML-safe text.
7. Be friendly, encouraging, and pedagogical.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, level, language, topic } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages[]", { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_PROMPT.replace("{{LEVEL}}", level).replace(
        "{{LANGUAGE}}",
        language
      ),
    });

    // Convertimos historial a formato Gemini
    const history = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const topicContext = topic
      ? `The student chose this topic: ${topic}.`
      : "";

    // Generación en streaming
    const result = await model.generateContentStream({
      contents: [
        ...(topicContext
          ? [
              {
                role: "user",
                parts: [{ text: topicContext }],
              },
            ]
          : []),
        ...history,
      ],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          console.error("🔥 Streaming error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err) {
    console.error("❌ Error in /api/chat:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
