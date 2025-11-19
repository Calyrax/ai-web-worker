import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan || !Array.isArray(plan)) {
      return NextResponse.json(
        { error: "Invalid or missing plan" },
        { status: 400 }
      );
    }

    // Fix old action types (from GPT) to match the runner
    const normalizedPlan = plan.map((step: any) => {
      const fixed = { ...step };

      if (fixed.action === "goto") fixed.action = "open_page";
      if (fixed.action === "extract") fixed.action = "extract_list";

      return fixed;
    });

    const runnerUrl = process.env.RUNNER_URL;
    if (!runnerUrl) {
      return NextResponse.json(
        { error: "Missing RUNNER_URL env variable" },
        { status: 500 }
      );
    }

    const response = await fetch(`${runnerUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalizedPlan }),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Execute Error:", error);
    return NextResponse.json(
      { error: "Task execution failed" },
      { status: 500 }
    );
  }
}

