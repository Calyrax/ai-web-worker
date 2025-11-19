import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Universal extractor for Responses API
function extractOutputText(completion: any): string {
  const out = completion?.output?.[0];

  if (!out) return "";

  // Case 1: reasoning
  if (out.type === "reasoning") {
    return out.reasoning?.[0]?.text ?? "";
  }

  // Case 2: model message with content array
  if (out.type === "message" && Array.isArray(out.content)) {
    return out.content
      .map((c: any) => c?.text?.value || c?.text || "")
      .join("\n")
      .trim();
  }

  // Case 3: direct output_text
  if (out.type === "output_text") {
    return out.text?.value ?? out.text ?? "";
  }

  // Fallback
  return JSON.stringify(out);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const completion = await client.responses.create({
      model: "o3-mini",
      input: `
Return ONLY a JSON array. Do not include anything else.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
      `
    });

    const text = extractOutputText(completion);

    let plan;
    try {
      plan = JSON.parse(text);
    } catch (err) {
      return NextResponse.json(
        { error: "Could not parse JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error) {
    console.error("PLAN ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}




