import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    // Debug check env
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is missing");
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const { prompt } = await req.json();

    if (!prompt) {
      console.error("❌ Missing prompt");
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    console.log("🟦 Calling OpenAI with:", prompt);

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
Return ONLY a JSON array, no extra text.
Allowed actions: open_page, wait, extract_list
User request: ${prompt}
`,
      temperature: 0,
    });

    console.log("🟩 OpenAI Response received");

    const out = completion?.output?.[0];
    console.log("🔵 Raw first output:", out);

    let text = "";

    if (out?.type === "message" && Array.isArray(out.content)) {
      text = out.content.map((c: any) => c.text?.value ?? "").join("\n");
    } else if (out?.type === "output_text") {
      text = out.text ?? out.text?.value ?? "";
    } else if (typeof out === "string") {
      text = out;
    }

    console.log("🟪 Extracted text:", text);

    let plan = [];
    try {
      plan = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err, "RAW TEXT:", text);
      return NextResponse.json(
        { error: "Invalid JSON from model", raw: text },
        { status: 500 }
      );
    }

    console.log("🟩 Final plan:", plan);

    return NextResponse.json({ plan });

  } catch (err) {
    console.error("❌ PLAN RUNTIME ERROR:", err);
    return NextResponse.json(
      { error: "Plan generation failed", details: String(err) },
      { status: 500 }
    );
  }
}




