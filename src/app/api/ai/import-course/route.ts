import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await extractTextFromFile(file);

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "File content too short or unreadable" },
        { status: 400 }
      );
    }

    const draft = await parseDocumentWithAI(text);
    return NextResponse.json(draft);

  } catch (err) {
    console.error("IMPORT COURSE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to import content" },
      { status: 500 }
    );
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (file.name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  throw new Error("Unsupported file type");
}

async function parseDocumentWithAI(text: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 1,
    messages: [
      {
        role: "system",
        content: `You are a precise document parser. Extract content EXACTLY as written.

🚨 CRITICAL RULES:
1. NEVER invent content - only extract what exists
2. Preserve EXACT wording and formatting
3. Each exercise MUST have "title" and "instructions" fields
4. Return ONLY valid JSON, no markdown fences

📋 EXERCISE STRUCTURE (MANDATORY):
Every exercise must include:
{
  "id": "unique-id",
  "type": "exercise_type",
  "title": "Exact title/heading from document",
  "instructions": "Exact instructions from document",
  ...type-specific fields
}

🎯 EXERCISE TYPE DETECTION:
- Multiple choice (a, b, c options) → "multiple_choice"
- True/False statements → "true_false"
- Fill blanks (_____ or ***) → "fill_blank"
- Verb conjugation tables → "verb_table"
- Match columns → "matching"
- Reorder/sequence → "reorder"
- Read + answer questions → "reading"
- Listen + answer → "listening"
- Speaking prompts → "speaking"
- Reflection prompts → "reflection"
- Correct sentences → "sentence_correction"
- Open-ended questions → "text"

📝 FIELD EXTRACTION PRIORITY:
1. Look for explicit "Title:" or exercise numbers (Ex 1.2)
2. Extract instructions (often bolded or before the exercise)
3. Extract the specific content based on type`,
      },
      {
        role: "user",
        content: `Parse this document into JSON. Extract content EXACTLY as written.

REQUIRED SCHEMA:
{
  "units": [
    {
      "titulo": "exact unit title",
      "descripcion": "unit description if present",
      "lecciones": [
        {
          "blocks": [
            {"type": "title", "value": "section title"},
            {"type": "theory", "value": "theory content"}
          ],
          "exercises": [
            {
              "id": "ex-1",
              "type": "multiple_choice",
              "title": "EXACT TITLE FROM DOCUMENT",
              "instructions": "EXACT INSTRUCTIONS FROM DOCUMENT",
              "question": "exact question text",
              "options": ["option a", "option b"],
              "correctIndex": 0
            }
          ]
        }
      ]
    }
  ]
}

🔍 EXAMPLE PATTERNS TO DETECT:

1. Multiple Choice:
"Exercise 1.2: Choose the best option
Why is Mr. Diaz calling?
a) To complain
b) To place an order ✓
c) To cancel"

→ Extract:
{
  "title": "Exercise 1.2: Choose the best option",
  "instructions": "Choose the best option",
  "question": "Why is Mr. Diaz calling?",
  "options": ["To complain", "To place an order", "To cancel"],
  "correctIndex": 1
}

2. Fill in the Blank:
"Activity 2: Complete with Present Continuous
Use the verbs in parentheses.
I ___ (work) on a project."

→ Extract:
{
  "title": "Activity 2: Complete with Present Continuous",
  "instructions": "Use the verbs in parentheses.",
  "sentence": "I *** (work) on a project.",
  "answers": ["am working"]
}

3. True/False:
"Exercise 3: Mark T/F
Read and decide if true or false.
Lena is a developer. (T)"

→ Extract:
{
  "title": "Exercise 3: Mark T/F",
  "instructions": "Read and decide if true or false.",
  "statement": "Lena is a developer.",
  "answer": true
}

4. Verb Table:
"Complete the table with Present Continuous forms
| Subject | Positive | Negative |
| I | am working | ___ |"

→ Extract:
{
  "title": "Complete the table with Present Continuous forms",
  "instructions": "Complete the missing forms",
  "rows": [
    {"subject": "I", "positive": "am working", "negative": "am not working"}
  ],
  "blanks": [{"rowIndex": 0, "column": "negative"}],
  "correct": {"0-negative": "am not working"}
}

⚠️ CRITICAL REQUIREMENTS:
- EVERY exercise needs "title" (even if "Exercise 1")
- EVERY exercise needs "instructions" (even if brief)
- Use "***" for blanks in fill_blank exercises
- Preserve markdown: **bold**, *italic*, bullets
- Generate unique IDs for all exercises/questions

DOCUMENT TO PARSE:
"""
${text.slice(0, 15000)}
"""

Return ONLY the JSON object, no explanations.`,
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  if (!raw) throw new Error("Empty AI response");

  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    
    if (!parsed.units || !Array.isArray(parsed.units)) {
      throw new Error("Invalid structure: missing units array");
    }
    
    return parsed;
  } catch (err) {
    console.error("❌ AI returned invalid JSON:", cleaned.slice(0, 500));
    throw new Error("AI generated invalid JSON");
  }
}