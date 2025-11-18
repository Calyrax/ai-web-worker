import { NextResponse } from "next/server";

/**
 * POST /api/execute
 * Sends the plan to the Railway Runner backend.
 */

const RUNNER_URL = process.env.RUNNER_URL; // Example: https://ai-web-worker-runner-production.up.railway.app

if (!RUNNER_URL) {
  console.warn("❗ WARNING: RUNNER_URL is NOT set in Vercel env vars.");
}

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!Array.isArray(plan) || plan.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty plan" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 1. IMPROVE PLAN BEFORE SENDING TO RUNNER
    //    Add scrolling + waitForSelector for extraction
    // -----------------------------------------

    const enhancedPlan = [];

    for (const step of plan) {
      enhancedPlan.push(step);

      // Inject waitForSelector BEFORE extraction
      if (step.action === "extract_list" && step.selector) {
        enhancedPlan.push({
          action: "wait_for_selector",
          selector: step.selector,
          timeout: 8000,
        });

        // Add scroll-to-bottom to load lazy content (Amazon, Zillow)
        enhancedPlan.push({
          action: "scroll_to_bottom",
          times: 4,
          delay: 600,
        });

        // Add small delay after scroll
        enhancedPlan.push({
          action: "wait",
          milliseconds: 1200,
        });
      }
    }

    // -----------------------------------------
    // 2. Send to runner backend
    // -----------------------------------------

    const runnerResponse = await fetch(`${RUNNER_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: enhancedPlan }),
    });

    let data;
    try {
      data = await runnerResponse.json();
    } catch (err) {
      return NextResponse.json(
        {
          error: "Runner returned invalid JSON (HTML?)",
          details: `Status ${runnerResponse.status}`,
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 3. Return data back to UI
    // -----------------------------------------

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error in execute route" },
      { status: 500 }
    );
  }
}
