import { afterAll, beforeAll, describe, it } from "jsr:@std/testing@1.0.15/bdd";
import { expect } from "jsr:@std/expect@1.0.17";
import { dirname, fromFileUrl, join, toFileUrl } from "jsr:@std/path@1.1.6";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

const rootDir = dirname(dirname(dirname(fromFileUrl(import.meta.url))));
const artifactUrl = toFileUrl(join(rootDir, "dist/hcweb.html")).href;

let browser: Browser;
let page: Page;
const failures: string[] = [];

beforeAll(async () => {
  browser = await chromium.launch();
  const context = await browser.newContext({ offline: true });

  // Any automatic network access is a defect in an offline artifact.
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("file:")) return route.continue();
    failures.push(`request ${url}`);
    return route.abort();
  });

  page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror ${error.message}`));

  await page.goto(artifactUrl);
});

afterAll(async () => {
  await browser?.close();
});

/** Waits until the selector's trimmed text equals the expected value. */
async function waitForText(selector: string, expected: string): Promise<void> {
  await page.waitForFunction(
    ({ selector, expected }) =>
      document.querySelector(selector)?.textContent?.trim() === expected,
    { selector, expected },
  );
}

async function submit(source: string): Promise<void> {
  await page.getByLabel("HC source").fill(source);
  await page.getByRole("button", { name: "Submit" }).click();
}

describe("standalone artifact in a browser", () => {
  it("evaluates HC offline from a file:// URL", async () => {
    await page.getByRole("heading", { name: "HC Playground" }).waitFor();

    await submit("2 + 2");
    await waitForText("[data-testid=latest-output]", "4");
    expect(await page.getByRole("cell", { name: "2 + 2" }).count()).toBe(1);
  });

  it("shows a diagnostic and recovers", async () => {
    await submit("@");
    await page.locator("[role=alert]").waitFor();
    expect(await page.locator("[role=alert]").textContent()).toContain("$!.");

    await submit("3 * 3");
    await waitForText("[data-testid=latest-output]", "9");
    expect(await page.locator("[role=alert]").count()).toBe(0);
  });

  it("submits from the keyboard and exposes accessible controls", async () => {
    await page.getByLabel("HC source").fill("7 + 1");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.textContent))
      .toBe("Submit");

    await page.keyboard.press("Enter");
    await waitForText("[data-testid=latest-output]", "8");
    expect(
      await page.locator("[data-testid=latest-output]").getAttribute(
        "aria-live",
      ),
    ).toBe("polite");
  });

  it("resets interpreter state", async () => {
    await page.getByRole("button", { name: "Reset interpreter" }).click();
    await waitForText("[data-testid=latest-output]", "Output will appear here");
    expect(await page.getByText("No evaluations yet.").count()).toBe(1);
  });

  it("made no network request and logged no error", () => {
    expect(failures).toEqual([]);
  });
});
