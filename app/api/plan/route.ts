import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract raw JSON plan text from OpenAI Responses API output.
 * Handles all content formats and avoids TypeScript issues.
 */
function extractText(output: any): string {
  if (!output) throw new Error("No output from model");

  // The model may return: [{ type: "output_text", text: "..." }]
  for (const item of output) {
    if (typeof item === "string") return item;
    if (item?.text) return item.text;
    if (item?.content?.text) return item.content.text;
    if (item?.content?.[0]?.text) return item.content[0].text;
  }

  throw new Error("Could not find text content in model output");
}

/**
 * Improve selectors automatically for known websites.
 */
function improvePlanForKnownSites(plan: any[], url: string) {
  const hostname = new URL(url).hostname;

  // Hacker News
  if (hostname.includes("ycombinator.com")) {
    return plan.map((step) =>
      step.action === "extract_list"
        ? { ...step, selector: "span.titleline a", limit: 30 }
        : step
    );
  }

  // Amazon
  if (hostname.includes("amazon.com")) {
    return plan.map((step) =>
      step.action === "extract_list"
        ? {
            ...step,
            selector:
              "div[data-component-type='s-search-result'] h2 a.a-link-normal",
            limit: 30,
          }
        : step
    );
  }

  // Zillow
  if (hostname.includes("zillow.com")) {
    return plan.map((step) =>
      step.action === "extract_list"
        ? {
            ...step,
            selector: "ul.photo-cards li article a",
            limit: 20,
          }
        : step
    );
  }

  return plan;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: `
Generate ONLY valid JSON for browser actions.

Example format:
[
  { "action": "open_page", "url": "https://example.com" },
  { "action": "wait", "milliseconds": 1500 },
  { "action": "extract_list", "selector": "CSS_SELECTOR", "limit": 30 }
]

User request: "${prompt}"
`,
    });

    // ---- FIXED: safe extraction (no TS errors) ----
    const raw = extractText(response.output);
    const plan = JSON.parse(raw);

    // Find the primary URL
    const firstOpen = plan.find((s: any) => s.action === "open_page");
    const url = firstOpen?.url || "";

    // Improve selectors automatically
    const improvedPlan = improvePlanForKnownSites(plan, url);

    return NextResponse.json({ plan: improvedPlan });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error generating plan" },
      { status: 500 }
    );
  }
}

