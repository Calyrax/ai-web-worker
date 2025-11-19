import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !Array.isArray(plan)) {
      return NextResponse.json(
        { error: "Invalid or missing plan" },
        { status: 400 }
      );
    }

    // Fix or normalize action types from GPT
    const normalizedPlan = plan.map((step: any) => {
      const s = { ...step };

      if (s.action === "goto") s.action = "open_page";
      if (s.action === "extract") s.action = "extract_list";

      return s;
    });

    const runnerUrl = process.env.RUNNER_URL;
    if (!runnerUrl) {
      return NextResponse.json(
        { error: "Missing RUNNER_URL environment variable" },
        { status: 500 }
      );
    }

    // Call Railway runner
    const response = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalizedPlan }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("RUNNER ERROR:", err);
      return NextResponse.json(
        { error: "Runner returned an error", details: err },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("EXECUTE ERROR:", error);
    return NextResponse.json(
      { error: "Task execution failed" },
      { status: 500 }
    );
  }
}
