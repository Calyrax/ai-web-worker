import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check (Railway uses this to confirm deployment success)
app.get("/", (req, res) => {
  res.json({ status: "runner-online" });
});

// Main execution route
app.post("/run", async (req, res) => {
  const { plan } = req.body;

  if (!Array.isArray(plan)) {
    return res.status(400).json({ error: "plan must be an array" });
  }

  let logs = [];
  let screenshotBase64 = null;

  try {
    logs.push("Launching browser...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    for (const step of plan) {
      logs.push(`Executing step: ${JSON.stringify(step)}`);

      // OPEN PAGE
      if (step.action === "goto") {
        await page.goto(step.url, { waitUntil: "load" });
        logs.push(`Navigated to: ${step.url}`);
      }

      // CLICK
      if (step.action === "click") {
        await page.click(step.selector);
        logs.push(`Clicked: ${step.selector}`);
      }

      // TYPE
      if (step.action === "type") {
        await page.type(step.selector, step.value);
        logs.push(`Typed into ${step.selector}: ${step.value}`);
      }

      // WAIT
      if (step.action === "wait") {
        await page.waitForTimeout(step.value);
        logs.push(`Waited ${step.value} ms`);
      }

      // SCREENSHOT (always returns Base64, not file)
      if (step.action === "screenshot") {
        const buffer = await page.screenshot({ encoding: "base64" });
        screenshotBase64 = buffer;
        logs.push("Screenshot captured");
      }
    }

    await browser.close();
    logs.push("Browser closed");

    return res.json({
      logs,
      screenshot: screenshotBase64,
    });

  } catch (err) {
    console.error("Runner error:", err);
    return res.status(500).json({
      error: "Runner crashed",
      message: err.message,
      logs,
    });
  }
});

// PORT required by Railway
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Runner listening on port ${PORT}`);
});
