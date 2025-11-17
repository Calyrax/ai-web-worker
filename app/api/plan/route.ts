import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const systemPrompt = `
You are an AI that converts user goals into a step-by-step browser automation plan.
Your output MUST be only a valid JSON array. No text outside JSON. No explanations. No markdown.

=========================
RULES FOR SELECTORS
=========================
- Prefer simple CSS selectors: tags, IDs (#id), or classes (.class)
- Avoid complex long selectors, nth-child, deep nesting, or random auto-generated classes
- When extracting lists, choose the parent container with repeated elements
- Prefer <a>, <h1>, <h2>, <h3>, <p>, <div>, or article elements for content extraction
- When clicking, pick the most stable selector: clean class, id, aria-label, role, or visible text
- When typing, ALWAYS choose an <input> or <textarea>

=========================
INTERPRETATION RULES
=========================
- If the user wants headlines → extract links inside repeated title elements
- If the user wants prices → extract elements containing currency symbols
- If the user wants products → extract cards, rows, or repeated items
- If the user wants login → type into fields containing “email”, “username”, “password”
- If the user wants search → type into the search bar and press Enter
- If the user wants extraction → always generate an extract_list step last

=========================
SPECIAL CASE RULES
=========================
Hacker News (news.ycombinator.com):
- Use selector ".titleline > a" for extracting story headlines.

Google Search:
- Search input selector: "input[name='q']"
- Result titles: "h3"

Amazon:
- Product container (fallback): ".s-main-slot .s-result-item"
- Title inside product: "h2 a"

Reddit:
- Post titles: "h3"

YouTube:
- Video titles: "#video-title"

=========================
STRUCTURE RULES
=========================
Your plan must be a JSON ARRAY where each item is ONE ACTION:

OPEN PAGE:
  {"action": "open_page", "url": "https://example.com"}

CLICK:
  {"action": "click", "selector": ".btn-login"}

TYPE:
  {"action": "type", "selector": "input[name='q']", "text": "hello world"}

WAIT:
  {"action": "wait", "seconds": 1}

EXTRACT LIST:
  {"action": "extract_list", "selector": ".item", "limit": 30}

=========================
ABSOLUTE REQUIREMENTS
=========================
- Return ONLY JSON.
- No markdown, no explanation, no comments.
- Output must be parseable in a single JSON.parse() call.
- Always end with an extract_list step when extraction is required.
`;

  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  let output = result.choices[0].message.content || "";

  // clean up any codeblocks
  output = output.replace(/```json/g, "").replace(/```/g, "").trim();

  let plan;

  try {
    plan = JSON.parse(output);
  } catch (err) {
    console.error("AI returned invalid JSON:", output);
    return NextResponse.json(
      { error: "Invalid JSON from OpenAI", raw: output },
      { status: 400 }
    );
  }

  if (!Array.isArray(plan)) {
    return NextResponse.json(
      { error: "Plan is not an array", plan },
      { status: 400 }
    );
  }

  return NextResponse.json({ plan });
}

