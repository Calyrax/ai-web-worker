import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { plan } = await req.json();

  if (!plan || !Array.isArray(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const runnerUrl = process.env.RUNNER_URL;
    if (!runnerUrl) {
      throw new Error("Missing RUNNER_URL environment variable");
    }

    const res = await fetch(runnerUrl + "/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
