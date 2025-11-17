import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: Request) {
  const { plan } = await req.json();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let logs: string[] = [];
  let extracted: any[] = [];

  for (const step of plan) {
    logs.push(`Executing: ${JSON.stringify(step)}`);

    if (step.action === "open_page") {
      await page.goto(step.url);
      logs.push(`Opened page: ${step.url}`);
    }

    if (step.action === "click") {
      await page.click(step.selector);
      logs.push(`Clicked selector: ${step.selector}`);
    }

    if (step.action === "type") {
      await page.fill(step.selector, step.text);
      logs.push(`Typed into ${step.selector}: ${step.text}`);
    }

    if (step.action === "wait") {
      await page.waitForTimeout(step.seconds * 1000);
      logs.push(`Waited ${step.seconds} seconds`);
    }

    if (step.action === "extract_list") {
      const items = await page.$$eval(step.selector, (elements) =>
        elements.map((el) => ({
          text: el.textContent?.trim(),
        }))
      );

      extracted = items.slice(0, step.limit);
      logs.push(`Extracted ${extracted.length} items`);
    }
  }

  await browser.close();

  return NextResponse.json({
    log: logs,
    result: extracted,
  });
}
