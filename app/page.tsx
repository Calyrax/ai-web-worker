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

    try {
      //
      // 1. Generate a plan from the user's prompt
      //
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const planData = await planRes.json();

      if (!planData.plan) {
        setLogs((prev) => [...prev, "Error: Plan generation failed."]);
        setLoading(false);
        return;
      }

      const rawPlan = planData.plan;
      const flatPlan = Array.isArray(rawPlan)
        ? rawPlan
        : Array.isArray(rawPlan.plan)
        ? rawPlan.plan
        : [];

      if (!Array.isArray(flatPlan) || flatPlan.length === 0) {
        setLogs((prev) => [...prev, "Error: Plan is not an array of steps."]);
        setLoading(false);
        return;
      }

      setLogs((prev) => [...prev, "Plan created. Running task..."]);

      //
      // 2. Execute plan using the backend runner
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
    } catch (err: any) {
      console.error(err);
      setLogs((prev) => [...prev, "Fatal error: " + String(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">AI Web Worker</h1>
        <p className="text-gray-600">
          Tell the AI what you want done on the internet — it will browse,
          click, search, extract, and return results.
        </p>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              setPrompt(
                "Go to https://news.ycombinator.com and extract the top 30 headlines."
              )
            }
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hacker News
          </button>

          <button
            onClick={() =>
              setPrompt(
                "Go to https://www.amazon.com/s?k=ipad and extract the top 20 product titles and prices."
              )
            }
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Amazon Deals
          </button>

          <button
            onClick={() =>
              setPrompt(
                "Go to https://www.zillow.com/homes/for_rent/Los-Angeles,-CA and extract the top 20 apartment listings."
              )
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
          className="w-full p-4 border border-gray-300 rounded-lg bg-white"
          rows={4}
        />

        {/* Run Button */}
        <button
          onClick={runTask}
          disabled={loading || !prompt.trim()}
          className="px-5 py-2 bg-black text-white rounded-lg disabled:opacity-50"
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
            {logs.length === 0 && (
              <div className="text-gray-400 text-sm">
                Logs will appear here after you run a task.
              </div>
            )}
          </div>
        </div>

        {/* Pretty Results */}
        {results.length > 0 && (
          <div className="bg-white p-5 rounded-lg border shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Results
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((item, i) => {
                // Try to guess price inside text
                const hasPrice = item.text?.match(/\$\d+[,\d]*/);

                // Try to guess image URL inside text (rare but works sometimes)
                const imgUrl =
                  item.text?.match(
                    /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i
                  )?.[0] || null;

                return (
                  <div
                    key={i}
                    className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white flex flex-col"
                  >
                    {/* Thumbnail */}
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt="thumbnail"
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}

                    {/* Main Text */}
                    <div className="font-medium text-gray-900 line-clamp-4 mb-2">
                      {item.text || "No text found"}
                    </div>

                    {/* Price Badge */}
                    {hasPrice && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mb-2 w-fit">
                        {hasPrice[0]}
                      </span>
                    )}

                    {/* Link */}
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm break-all mt-auto"
                      >
                        Open Link →
                      </a>
                    ) : (
                      <div className="text-xs text-gray-400 mt-auto">
                        No link available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


