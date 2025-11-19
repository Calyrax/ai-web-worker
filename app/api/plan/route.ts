import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// --- Extractor: works for ALL new Responses API formats ---
function extractText(response: any): string {
  const out = response?.output?.[0];
  if (!out) return "";

  // New Responses API format
  if (out.type === "output_text" && out.text) {
    return out.text;
  }

  // Fallback: old style message formats
  if (out.type === "message" && Array.isArray(out.content)) {
    return out.content
      .map((c: any) => c.text?.value ?? "")
      .join("\n")
      .trim();
  }

  // If raw string
  if (typeof out === "string") return out;

  return "";
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
Return ONLY valid JSON array. No text outside JSON.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`
    });

    const text = extractText(completion);
    console.log("PLAN RAW OUTPUT:", text);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Model returned empty output", raw: completion },
        { status: 500 }
      );
    }

    let plan;
    try {
      plan = JSON.parse(text);
    } catch (err: any) {
      console.error("JSON Parse Error:", err);
      return NextResponse.json(
        { error: "JSON parse failed", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}

