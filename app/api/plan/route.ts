import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Minimal parser that never triggers TS errors
function extractText(out: any): string {
  try {
    if (!out) return "";

    // v1 format: output[0].content[0].text.value
    if (out[0]?.content?.[0]?.text?.value) {
      return out[0].content[0].text.value;
    }

    // Fallback: output_text structure
    if (out[0]?.text?.value) {
      return out[0].text.value;
    }

    // If string
    if (typeof out === "string") return out;

    return "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await client.responses.create({
      model: "o3-mini",
      input: `
Return ONLY a JSON array. No text outside JSON.

Allowed actions:
- open_page
- wait
- extract_list

User request:
${prompt}
`
    });

    const raw = extractText(completion.output);
    let plan = JSON.parse(raw);

    return NextResponse.json({ plan });
  } catch (err: any) {
    console.error("PLAN ROUTE ERROR", err);
    return NextResponse.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}



