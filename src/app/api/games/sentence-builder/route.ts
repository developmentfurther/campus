import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Generate ONE short, simple English sentence appropriate for A1–B2 students.
Rules:
- 5 to 10 words
- Common vocabulary
- Grammatically correct
- No commas, no quotes, no names
- Return ONLY the sentence.
`;

    const result = await model.generateContent(prompt);
    const sentence = result.response.text().trim();

    const words = sentence.split(" ").map(w => w.trim());
    const shuffled = [...words].sort(() => Math.random() - 0.5);

    return NextResponse.json({ 
      sentence,
      words,
      shuffled
    });
  } catch (err) {
    console.error("Sentence builder error:", err);

    const fallback = "She is reading a book";
    const fallbackWords = fallback.split(" ");

    return NextResponse.json({
      sentence: fallback,
      words: fallbackWords,
      shuffled: [...fallbackWords].sort(() => Math.random() - 0.5)
    });
  }
}
