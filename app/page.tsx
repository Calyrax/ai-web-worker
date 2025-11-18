"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const runTask = async () => {
    setLoading(true);
    setLogs([]);
    setResults([]);

    //
    // 1. Generate PLAN from OpenAI
    //
    const planRes = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const planData = await planRes.json();
    console.log("RAW PLAN FROM /api/plan:", planData);

    if (!planData.plan) {
      setLogs((prev) => [...prev, "Error: Plan generation failed."]);
      setLoading(false);
      return;
    }

    //
    // Flatten possible formats returned by the model
    //
    let flatPlan = planData.plan;

    // Case 1: { plan: { plan: [...] } }
    if (!Array.isArray(flatPlan) && Array.isArray(flatPlan.plan)) {
      flatPlan = flatPlan.plan;
    }

    // Case 2: Sometimes GPT returns { plan: { steps: [...] } }
    if (!Array.isArray(flatPlan) && Array.isArray(flatPlan.steps)) {
      flatPlan = flatPlan.steps;
    }

    if (!Array.isArray(flatPlan)) {
      console.error("Plan is not array:", flatPlan);
      setLogs((prev) => [...prev, "Error: Plan is not an array of steps."]);
      setLoading(false);
      return;
    }

    setLogs((prev) => [...prev, "Plan created. Running task..."]);
    console.log("FLATTENED PLAN:", flatPlan);

    //
    // 2. EXECUTE VIA BACKEND
    // Frontend must send { plan: [...] }
    //
    const execRes = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: flatPlan }),
    });

    const execData = await execRes.json();
    console.log("EXEC RESPONSE:", execData);

    if (execData.error) {
      setLogs((prev) => [...prev, "Error: " + execData.error]);
      setLoading(false);
      return;
    }

    setLogs((prev) => [...prev, ...(execData.logs || [])]);
    setResults(execData.result || []);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold text-gray-900">AI Web Worker</h1>
        <p className="text-gray-600">
          Tell the AI what you want done on the internet — it will browse, click, search, extract, and return results.
        </p>

        {/* Preset Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              setPrompt("Go to https://news.ycombinator.com and extract the top 30 headlines.")
            }
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hacker News
          </button>

          <button
            onClick={() =>
              setPrompt("Go to https://www.amazon.com/s?k=ipad and extract the top 20 product titles and prices.")
            }
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Amazon Deals
          </button>

          <button
            onClick={() =>
              setPrompt("Go to https://www.zillow.com/homes/for_rent/Los-Angeles,-CA and extract the top 20 apartment listings.")
            }
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Zillow LA
          </button>
        </div>

        {/* Input Box */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want the AI to do?"
          className="w-full p-4 border border-gray-300 rounded-lg"
          rows={4}
        />

        {/* Run Button */}
        <button
          onClick={runTask}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Task"}
        </button>

        {/* Logs */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Logs</h2>
          <div className="text-sm space-y-1 max-h-60 overflow-auto">
            {logs.map((log, i) => (
              <div key={i}>• {log}</div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            <div className="overflow-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    {Object.keys(results[0]).map((col) => (
                      <th key={col} className="px-4 py-2 border-b border-gray-300">
                        {col.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {results.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.values(item).map((val: any, j) => (
                        <td key={j} className="px-4 py-2 border-b border-gray-300">
                          {typeof val === "string" ? val : JSON.stringify(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

