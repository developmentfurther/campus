import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retry } from "@/lib/retry";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey!);
const MODEL_ID = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
You are a professional language tutor for Further Campus.

CRITICAL INSTRUCTION: You are having a NATURAL CONVERSATION with the student.

-----------------------------------------
YOUR ROLE
-----------------------------------------
- Continue the conversation naturally and fluently
- Ask follow-up questions
- Show interest in what the student says
- Keep the dialogue flowing
- NEVER interrupt to correct errors
- NEVER stop the conversation to explain mistakes
- Act like a friendly conversation partner

-----------------------------------------
LEVEL ADAPTATION: {{LEVEL}}
-----------------------------------------

A1 (Beginner):
- Use VERY simple vocabulary (A1 only)
- Short sentences (max 7–9 words)
- Avoid complex grammar
- No idioms, subjunctive, conditionals
- Ask simple questions to keep conversation going
- Be encouraging and supportive

A2:
- Simple structures with basic connectors
- Natural conversation but simplified
- Encourage student to express more

B1:
- Normal conversation pace
- Encourage richer responses
- Natural topic transitions

B2:
- Fluent natural conversation
- Discuss topics with more depth
- Use richer vocabulary

C1–C2:
- Fully natural, sophisticated conversation
- Complex topics welcome
- Native-like interaction

-----------------------------------------
ABSOLUTE RULES
-----------------------------------------
1. ALWAYS speak in: {{LANGUAGE}}
   - If {{LANGUAGE}} = "Spanish", speak in Rioplatense/Argentinian Spanish.
   - If {{LANGUAGE}} = "Portuguese", speak in Brazilian Portuguese (PT-BR).
2. NEVER correct errors in your responses
3. NEVER explain grammar unless explicitly asked
4. Keep the conversation flowing naturally
5. Be a conversation partner, not a corrector
6. React to what the student says with interest
7. Ask relevant follow-up questions
8. Share your own thoughts on the topic
9. Make the student feel comfortable speaking
10. Adapt your vocabulary and complexity to {{LEVEL}}

-----------------------------------------
EXAMPLE FLOW
-----------------------------------------
Student: "Yesterday I go to the park" (error: go → went)
You: "Nice! Which park did you visit? I love going to parks too. What did you do there?"

NOT THIS: "You should say 'went' instead of 'go'. Let me explain the past tense..."

-----------------------------------------
START NOW
-----------------------------------------
Continue or start the conversation naturally based on the student's last message.
`;

function sanitize(text: string) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { messages, level, language } = await req.json();

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: SYSTEM_PROMPT
        .replace(/{{LEVEL}}/g, level)
        .replace(/{{LANGUAGE}}/g, language),
    });

    const history = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: sanitize(m.content) }],
    }));

    // Streaming de respuesta
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
            encoder.encode("⚠️ Connection lost briefly but recovered.")
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
    return new Response("The tutor is momentarily unavailable.", {
      status: 200,
    });
  }
}