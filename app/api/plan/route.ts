import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function extractTextFromResponse(response: any): string {
  const out = response?.output;
  if (Array.isArray(out) && out.length > 0) {
    const first = out[0];

    if (first?.type === "message" && Array.isArray(first.content)) {
      return first.content
        .map((c: any) => c.text?.value ?? "")
        .join("\n")
        .trim();
    }

    if (first?.type === "output_text") {
      return first.text?.value ?? first.text ?? "";
    }

    if (typeof first === "string") return first;
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const completion = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1",
      input: `
You are an autonomous web worker.  
Convert the user's request into a JSON plan.

Allowed actions ONLY:
  - "open_page": { "url": "https://..." }
  - "wait": { "milliseconds": 1500 }
  - "extract_list": { "selector": "CSS_SELECTOR", "limit": N }
  - "goto" → convert to open_page  
  - "extract" → convert to extract_list  

Your output MUST be valid JSON array with steps like:
[
  { "action": "open_page", "url": "..." },
  { "action": "wait", "milliseconds": 1500 },
  { "action": "extract_list", "selector": "CSS_SELECTOR", "limit": 20 }
]

User request:
${prompt}
`,
    });

    const textOutput = extractTextFromResponse(completion);

    let plan: any[] = [];
    try {
      plan = JSON.parse(textOutput);
    } catch (err) {
      return NextResponse.json(
        { error: "Could not parse plan JSON", raw: textOutput },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Plan Error:", error);
    return NextResponse.json(
      { error: "Plan generation failed." },
      { status: 500 }
    );
  }
}

