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
Return ONLY a JSON array. No text, no explanation.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`
    });

    // Extract output text (o3-mini returns type: "output_text")
    const first: any = completion.output?.[0];

    let raw = "";

    if (first && first.type === "output_text") {
      raw = first.text; // <-- TS-safe (first is "any")
    } else {
      return NextResponse.json(
        {
          error: "Unexpected model output format",
          raw: completion.output
        },
        { status: 500 }
      );
    }

    const plan = JSON.parse(raw);

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed", details: error.message },
      { status: 500 }
    );
  }
}


