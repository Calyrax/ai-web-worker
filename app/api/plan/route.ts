import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Extract output text from Responses API
 */
function extractTextFromResponse(response: any): string {
  try {
    const block = response?.output?.[0];
    if (!block) return "";

    const contentArr = block?.content;
    if (!Array.isArray(contentArr)) return "";

    const textParts = contentArr
      .map((c: any) => c?.text?.value ?? "")
      .filter(Boolean);

    return textParts.join("\n").trim();
  } catch {
    return "";
  }
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

(actions must match exactly)
Allowed actions ONLY:
  - {"action": "open_page", "url": "..."}
  - {"action": "wait", "milliseconds": 1500}
  - {"action": "extract_list", "selector": "CSS_SELECTOR", "limit": N}

Do NOT use "goto" or "extract".
Do NOT wrap in markdown or quotes.
Return ONLY pure JSON.

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
        { error: "Could not parse JSON", raw: textOutput },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Plan Error:", error);
    return NextResponse.json(
      { error: "Plan generation failed." },
      { status: 500 }
    );
  }
}


