import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    console.log("EXECUTE RECEIVED PLAN:", plan);

    if (!Array.isArray(plan)) {
      return NextResponse.json(
        { error: "Plan must be an array before sending to runner." },
        { status: 400 }
      );
    }

    // Send the plan to the backend runner as "commands"
    const response = await fetch(
      "https://ai-web-worker-runner-production.up.railway.app/run",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commands: plan }), // 👈 FINAL SHAPE
      }
    );

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("EXECUTE API ERROR:", err);
    return NextResponse.json(
      { error: "Runner server unreachable", details: String(err) },
      { status: 500 }
    );
  }
}
