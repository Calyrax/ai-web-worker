import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !Array.isArray(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const normalized = plan.map(step => {
      const s = { ...step };
      if (s.action === "goto") s.action = "open_page";
      if (s.action === "extract") s.action = "extract_list";
      return s;
    });

    const runnerUrl = process.env.RUNNER_URL;
    if (!runnerUrl) {
      return NextResponse.json({ error: "Missing RUNNER_URL" }, { status: 500 });
    }

    const response = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalized })
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("EXECUTE ERROR:", err);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}
