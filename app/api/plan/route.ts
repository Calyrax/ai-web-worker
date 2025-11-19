import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await client.responses.create({
      model: "o3-mini",
      input: `
Return ONLY a JSON array. Do not include text or commentary.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`
    });

    // 🔍 LOG FULL RESPONSE
    console.log("FULL OPENAI RESPONSE:", JSON.stringify(completion, null, 2));

    // ⭐ NEW: Use `output_text` which is ALWAYS present
    const raw = completion.output_text || "";
    console.log("RAW OUTPUT TEXT:", raw);

    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Model returned empty output_text" },
        { status: 500 }
      );
    }

    let plan;

    try {
      plan = JSON.parse(raw);
    } catch (err) {
      console.error("JSON PARSE ERROR:", err);
      return NextResponse.json(
        { error: "Failed to parse plan JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ROUTE ERROR:", error);
    return NextResponse.json({ error: "Plan generation failed" }, { status: 500 });
  }
}

