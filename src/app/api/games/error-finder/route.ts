import { NextResponse } from "next/server";
import { ERROR_FINDER_DATA } from "@/lib/games/errorFinderData";

export async function GET() {
  try {
    const random = ERROR_FINDER_DATA[Math.floor(Math.random() * ERROR_FINDER_DATA.length)];
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
