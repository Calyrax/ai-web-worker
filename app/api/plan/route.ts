import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    const completion = await client.responses.create({
      model: "gpt-4.1",
      input: `
You are a web automation planner. Produce ONLY a JSON array of steps.
Each step must include: { "action": "...", "selector": "...", "url": "...", "text": "...", "limit": ... }

User request: "${prompt}"
`
    });

    // Extract text output safely
    const textOutput =
      completion.output_text ??
      completion.output?.[0]?.content?.[0]?.text ??
      "";

    if (!textOutput) {
      return NextResponse.json(
        { error: "Model returned no output_text." },
        { status: 500 }
      );
    }

    let plan;
    try {
      plan = JSON.parse(textOutput.trim());
    } catch (err) {
      console.error("JSON parse fail:", textOutput);
      return NextResponse.json(
        { error: "Failed to parse plan JSON." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("PLAN ERROR:", error);
    return NextResponse.json(
      { error: "Plan generation failed." },
      { status: 500 }
    );
  }
}


