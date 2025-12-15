import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_ID = "gpt-5-mini";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");
  return new OpenAI({ apiKey });
}

// 🔥 MAPEO: nombre completo → código ISO-639-1
const languageToISO: Record<string, string> = {
  english: "en",
  spanish: "es",
  portuguese: "pt",
  italian: "it",
  french: "fr",
};

const VOICE_ANALYSIS_PROMPT = `
You are a pronunciation and grammar analyzer for language learners.

Analyze the transcribed text for:
1. Grammar errors
2. Vocabulary mistakes
3. Pronunciation feedback (based on typical errors at this level)

Student level: {{LEVEL}}
Target language: {{LANGUAGE}}

IMPORTANT:
- If {{LANGUAGE}} = "Spanish", use Rioplatense/Argentinian Spanish
- If {{LANGUAGE}} = "Portuguese", use Brazilian Portuguese (PT-BR)

Return ONLY valid JSON with this structure:
{
  "corrections": [
    {
      "error": "exact incorrect text",
      "correction": "corrected version",
      "explanation": "brief explanation in target language",
      "position": 0
    }
  ],
  "pronunciation": {
    "score": 7,
    "feedback": "Brief feedback on pronunciation quality",
    "commonIssues": ["issue1", "issue2"]
  }
}

Guidelines:
- For A1-A2: Be lenient, focus on major errors only, score 6-10
- For B1-B2: Moderate strictness, score 5-10
- For C1-C2: High standards, score 4-10
- If transcription is perfect or near-perfect: corrections = [], score 9-10

Transcription:
{{TRANSCRIPTION}}
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const level = formData.get('level') as string;
    const language = formData.get('language') as string; // Viene como "english", "spanish", etc.

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    // 🔥 CONVERTIR el nombre del idioma a código ISO-639-1
    const isoCode = languageToISO[language?.toLowerCase()] || "en";

    // PASO 1: Transcribir audio con Whisper
    console.log("🎤 Transcribing audio...");
    console.log(`📍 Language: "${language}" → ISO: "${isoCode}"`);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: isoCode, // ✅ Ahora usa código ISO de 2 letras
      response_format: "text"
    });

    console.log("✅ Transcription:", transcription);

    // Si la transcripción está vacía o es muy corta
    if (!transcription || transcription.trim().length < 3) {
      return NextResponse.json({
        transcription: transcription || "[No speech detected]",
        corrections: [],
        pronunciation: {
          score: 0,
          feedback: "Could not detect clear speech. Please try again.",
          commonIssues: []
        }
      });
    }

    // PASO 2: Analizar errores y pronunciación
    console.log("🔍 Analyzing transcription...");

    const prompt = VOICE_ANALYSIS_PROMPT
      .replace(/{{LEVEL}}/g, level || "B1")
      .replace(/{{LANGUAGE}}/g, language || "English")
      .replace("{{TRANSCRIPTION}}", transcription);

    const analysisResult = await openai.chat.completions.create({
      model: MODEL_ID,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 1,
    });

    const analysisText = analysisResult.choices[0]?.message?.content || "{}";
    
    let analysis: any;
    try {
      analysis = JSON.parse(analysisText);
    } catch (error) {
      console.warn("⚠️ Invalid JSON from analysis:", analysisText);
      analysis = { corrections: [], pronunciation: { score: 7, feedback: "" } };
    }

    // Calcular posiciones de errores
    const corrections = (analysis.corrections || []).map((corr: any) => {
      const position = transcription
        .toLowerCase()
        .indexOf((corr.error || "").toLowerCase());
      
      return {
        ...corr,
        position: position >= 0 ? position : 0
      };
    });

    console.log("✅ Analysis complete:", { 
      corrections: corrections.length,
      score: analysis.pronunciation?.score 
    });

    return NextResponse.json({
      transcription,
      corrections,
      pronunciation: analysis.pronunciation || {
        score: 7,
        feedback: "Good pronunciation overall",
        commonIssues: []
      }
    });

  } catch (error: any) {
    console.error("🔥 Error in voice processing:", error);
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to process audio",
        transcription: "[Error processing audio]",
        corrections: [],
        pronunciation: { score: 0, feedback: "Processing failed" }
      },
      { status: 500 }
    );
  }
}