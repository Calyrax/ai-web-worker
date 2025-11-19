import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Safely extracts text output from the OpenAI Responses API.
 * Works for ALL models: o3-mini, gpt-4.1, gpt-4.1-mini, etc.
 */
function extractText(response: any): string {
  try {
    const item = response?.output?.[0];
    if (!item) return "";

    // New message-type output
    if (item.type === "message" && Array.isArray(item.content)) {
      return item.content
        .map((c: any) => c?.text?.value ?? "")
        .join("")
        .trim();
    }

    // Text output
    if (item.type === "output_text") {
      return item.text?.value ?? item.text ?? "";
    }

    // Fallback for raw strings
    if (typeof item === "string") return item;

    return "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Ask OpenAI to create a plan in pure JSON
    const completion = await client.responses.create({
      model: "o3-mini",
      input: `
You are a planning assistant.
Return ONLY a JSON array of steps. No explanation.

Each step must be in this format:
- { "action": "open_page", "url": "https://..." }
- { "action": "wait", "milliseconds": 1500 }
- { "action": "extract_list", "selector": "CSS_SELECTOR", "limit": N }

User request:
${prompt}
`
    });

    // Extract raw text output
    const textOutput = extractText(completion);

    let plan: any[] = [];
    try {
      plan = JSON.parse(textOutput);
    } catch (err) {
      return NextResponse.json(
        {
          error: "Could not parse JSON plan.",
          raw: textOutput
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error: any) {
    console.error("PLAN ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed" },
      { status: 500 }
    );
  }
}


