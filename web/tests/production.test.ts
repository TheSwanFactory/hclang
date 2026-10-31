import { expect } from "jsr:@std/expect@1.0.17";
import { chromium } from "playwright";

const url = Deno.env.get("HCWEB_URL") ??
  "https://theswanfactory.github.io/hclang/";
const expectedVersion = Deno.env.get("HCWEB_EXPECTED_VERSION");
const expectedCommit = Deno.env.get("HCWEB_EXPECTED_COMMIT");

Deno.test("production playground loads and evaluates HC", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    // Pages/CDN propagation may briefly return an older release or a 404.
    for (let attempt = 1; attempt <= 6; attempt++) {
      errors.length = 0;
      try {
        const response = await page.goto(url, { timeout: 30_000 });
        expect(response?.status()).toBe(200);
        await page.getByRole("heading", { name: "HC Playground" }).waitFor();
        const version = await page.locator('meta[name="hcweb-version"]')
          .getAttribute("content");
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        if (expectedVersion) expect(version).toBe(expectedVersion);
        if (expectedCommit) {
          expect(
            await page.locator('meta[name="source-commit"]').getAttribute(
              "content",
            ),
          ).toBe(expectedCommit);
        }
        break;
      } catch (error) {
        if (attempt === 6) throw error;
        console.log(`Waiting for ${url} (${attempt}/6): ${error}`);
        await new Promise((resolve) => setTimeout(resolve, 10_000));
      }
    }

    await page.getByLabel("HC source").fill("2 + 2");
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForFunction(() =>
      document.querySelector("[data-testid=latest-output]")?.textContent
        ?.trim() === "4"
    );
    expect(await page.getByRole("cell", { name: "2 + 2" }).count()).toBe(1);
    expect(await page.locator("[role=alert]").count()).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
