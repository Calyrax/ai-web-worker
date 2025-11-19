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
Return ONLY a JSON array of steps.
Each step MUST contain an "action" field.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`
    });

    // 🔥 THE ONLY FIELD YOU NEED
    const text = completion.output_text;

    // Log full raw text for debugging
    console.log("RAW PLAN OUTPUT:", text);

    // Parse safely
    const plan = JSON.parse(text);

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed", details: error.message },
      { status: 500 }
    );
  }
}


