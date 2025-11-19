import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Safe extraction for ALL OpenAI response formats
function extractText(resp: any): string {
  try {
    const out = resp?.output;
    if (!out || !Array.isArray(out)) return "";

    const first = out[0];

    // 1) message format
    if (first.type === "message" && Array.isArray(first.content)) {
      return first.content
        .map((c: any) => c.text?.value ?? "")
        .join("\n")
        .trim();
    }

    // 2) output_text format
    if (first.type === "output_text") {
      return first.text ?? first.text?.value ?? "";
    }

    // 3) plain string
    if (typeof first === "string") return first;

    return "";
  } catch (err) {
    console.error("extractText() failed:", err);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      input: `
Return ONLY a JSON array. No commentary.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`,
    });

    const text = extractText(completion);

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text output", raw: completion },
        { status: 500 }
      );
    }

    let plan;
    try {
      plan = JSON.parse(text);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON returned", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed", details: error.message },
      { status: 500 }
    );
  }
}



