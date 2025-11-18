import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  //
  // SUPER SIMPLE PLAN GENERATOR (reliable)
  //
  let url = "";
  let selector = "";

  // Detect URL in prompt
  const match = prompt.match(/https?:\/\/[^\s]+/);
  if (match) url = match[0];

  if (!url) {
    return NextResponse.json({ error: "No URL found in prompt" });
  }

  // Decide what selector to extract based on known sites
  if (url.includes("ycombinator.com")) {
    selector = "a.storylink, span.titleline a";
  } else if (url.includes("amazon.com")) {
    selector = "div.s-result-item h2 a";
  } else if (url.includes("zillow.com")) {
    selector = "article";
  } else {
    selector = "a";
  }

  const plan = [
    { action: "open_page", url },
    { action: "wait", milliseconds: 1500 },
    {
      action: "extract_list",
      selector,
      limit: 30,
    },
  ];

  return NextResponse.json({ plan });
}
