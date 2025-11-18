import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Permitir rango opcional: ?min=4&max=10
    const min = Number(url.searchParams.get("min") || 3);  
    const max = Number(url.searchParams.get("max") || 10);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Generate ONE random English word that:
- is between ${min} and ${max} letters long
- is a common dictionary word
- is not obscure, slang, archaic or invented
- contains only letters (no spaces, no punctuation)
- is not a proper noun
Respond ONLY with the word in lowercase, nothing else.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().toLowerCase();

    // Limpieza adicional
    text = text.replace(/[^a-z]/g, ""); // eliminar cualquier raro
    if (text.length < min || text.length > max) {
      throw new Error("Invalid length from AI");
    }

    return NextResponse.json({ word: text });
  } catch (err) {
    console.error("❌ Wordle endpoint error:", err);
    return NextResponse.json({ word: "apple" }); // fallback
  }
}
