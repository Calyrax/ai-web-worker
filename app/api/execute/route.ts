import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // Send the automation plan to the deployed Railway backend
    const response = await fetch(
      "https://ai-web-worker-runner-production.up.railway.app/run",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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

