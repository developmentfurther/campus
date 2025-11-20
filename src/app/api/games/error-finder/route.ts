import { NextRequest, NextResponse } from "next/server";
import { getErrorFinderBank } from "@/lib/games/errorFinderData";

export async function GET(req: NextRequest) {
  try {
    const lang = (req.nextUrl.searchParams.get("lang") || "en").toLowerCase();

    const BANK = getErrorFinderBank(lang);

    // fallback si está vacío
    if (!BANK || BANK.length === 0) {
      return NextResponse.json({
        sentence: "She go to school every day.",
        wrongWord: "go",
        correctWord: "goes",
      });
    }

    const random = BANK[Math.floor(Math.random() * BANK.length)];
    return NextResponse.json(random);

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      sentence: "She go to school every day.",
      wrongWord: "go",
      correctWord: "goes",
    });
  }
}
