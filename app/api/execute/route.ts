import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!Array.isArray(plan)) {
      return NextResponse.json(
        { error: "Invalid or missing plan" },
        { status: 400 }
      );
    }

    // Normalize old GPT actions
    const normalized = plan.map((step) => {
      const s = { ...step };

      if (s.action === "goto") s.action = "open_page";
      if (s.action === "extract") s.action = "extract_list";

      return s;
    });

    const runnerUrl = process.env.RUNNER_URL;
    if (!runnerUrl) {
      return NextResponse.json(
        { error: "Missing RUNNER_URL" },
        { status: 500 }
      );
    }

    const res = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalized }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Execute Error:", err);
    return NextResponse.json(
      { error: "Task execution failed" },
      { status: 500 }
    );
  }
}


