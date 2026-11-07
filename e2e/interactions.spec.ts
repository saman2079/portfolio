import { expect, test, type Page } from "@playwright/test";
import { findBlocked, gotoReady, PAGES, SECTIONS } from "./helpers";

for (const { name, path } of PAGES) {
  test.describe(`interactions [${name}]`, () => {
    // --- 1. Every interactive element in every section is reachable by a real pointer ---
    for (const id of SECTIONS) {
      test(`section #${id}: no interactive element is covered`, async ({ page }) => {
        await gotoReady(page, path);
        expect(await findBlocked(page, `#${id}`)).toEqual([]);
      });
    }

    test("top bar and dock are reachable", async ({ page }) => {
      await gotoReady(page, path);
      expect(await findBlocked(page, "header")).toEqual([]);
      expect(await findBlocked(page, "nav.fixed")).toEqual([]);
    });

    // --- 2. The invisible 3D layer must not capture pointers outside the hero ---
    test("3D layer does not intercept pointers once the hero is left", async ({ page }) => {
      await gotoReady(page, path);
      await page.evaluate(() => document.getElementById("projects")?.scrollIntoView({ behavior: "instant" }));
      await expect(page.locator(".world-layer")).toHaveAttribute("data-section", "projects");
      const captured = await page.evaluate(() => {
        const hits: string[] = [];
        for (let i = 1; i <= 9; i++) {
          for (let j = 1; j <= 9; j++) {
            const x = (innerWidth * i) / 10;
            const y = (innerHeight * j) / 10;
            const el = document.elementFromPoint(x, y);
            if (el?.closest(".world-layer")) hits.push(`${Math.round(x)},${Math.round(y)} -> ${el.tagName.toLowerCase()}`);
          }
        }
        return hits;
      });
      expect(captured).toEqual([]);
    });

    // --- 3. The core stays draggable in the hero (guards the fix against over-correcting) ---
    test("core area in the hero is still served by the 3D canvas", async ({ page }) => {
      await gotoReady(page, path);
      const box = await page.locator(".world-stage canvas").boundingBox();
      expect(box).not.toBeNull();
      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;
      const inStage = await page.evaluate(
        ([px, py]) => !!document.elementFromPoint(px!, py!)?.closest(".world-stage"),
        [x, y]
      );
      expect(inStage, "pointer at the core centre must reach the canvas").toBe(true);
    });

    // --- 4. Navigation ---
    test("dock links scroll to their section", async ({ page }) => {
      await gotoReady(page, path);
      for (const id of SECTIONS) {
        await page.locator(`nav.fixed a[href="#${id}"]`).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect
          .poll(async () => {
            const box = await page.locator(`#${id}`).boundingBox();
            const vh = page.viewportSize()!.height;
            return !!box && box.y < vh * 0.5 && box.y + box.height > vh * 0.2;
          })
          .toBe(true);
      }
    });

    test("top bar links scroll to their section (when shown)", async ({ page }) => {
      await gotoReady(page, path);
      const links = page.locator('header nav a[href^="#"]');
      test.skip(!(await links.first().isVisible()), "top bar links are hidden on this viewport");
      for (const id of SECTIONS) {
        await page.locator(`header nav a[href="#${id}"]`).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
      }
    });

    // --- 5. Hero buttons ---
    test("hero buttons work", async ({ page }) => {
      await gotoReady(page, path);
      const hero = page.locator("#top");
      const download = page.waitForEvent("download");
      await hero.locator("a[download]").click();
      expect((await download).suggestedFilename()).toMatch(/\.pdf$/);

      for (const href of ["https://github.com/saman2079", "https://www.linkedin.com/"]) {
        await hero.locator(`a[href="${href}"]`).click({ trial: true });
      }
      await hero.locator('a[href="#about"]').click({ trial: true });
      await hero.locator('a[href="#contact"]').first().click();
      await expect(page).toHaveURL(/#contact$/);
    });

    // --- 6. Lab controls (hero panel and Lab section) change the shared state ---
    for (const [scope, container, ids] of [
      ["hero panel", "aside.hero-labs", { light: "hero-lab-light", speed: "hero-lab-speed", particles: "hero-lab-particles" }],
      ["lab section", "#lab", { light: "lab-light", speed: "lab-speed", particles: "lab-particles" }],
    ] as const) {
      test(`lab controls [${scope}] update the core state`, async ({ page }) => {
        await gotoReady(page, path);
        const panel = page.locator(container);
        const readout = page.locator("#lab pre code");
        await panel.scrollIntoViewIfNeeded();

        await panel.locator('label:has(input[value="violet"])').click();
        await expect(readout).toContainText('color: "violet"');

        await panel.locator('label:has(input[value="ring"])').click();
        await expect(readout).toContainText('shape: "ring"');

        await clickSliderAt(page, `#${ids.light}`, 0.95);
        await expect(readout).toContainText(/light: (9\d|100)\b/);

        await clickSliderAt(page, `#${ids.speed}`, 0.05);
        await expect(readout).toContainText(/speed: ([0-9]|1\d)\b/);

        await clickSliderAt(page, `#${ids.particles}`, 0.95);
        await expect(readout).toContainText(/particles: (9|10)\b/);

        await panel.locator("button").last().click();
        await expect(readout).toContainText('color: "cyan"');
        await expect(readout).toContainText('shape: "orb"');
      });
    }

    // --- 7. Project cards ---
    test("project cards are hoverable and their links clickable", async ({ page }) => {
      await gotoReady(page, path);
      const cards = page.locator("#projects article");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await cards.nth(i).scrollIntoViewIfNeeded();
        await cards.nth(i).hover();
        const links = cards.nth(i).locator("a[href]");
        for (let j = 0; j < (await links.count()); j++) {
          await links.nth(j).click({ trial: true });
        }
      }
    });

    // --- 8. Contact form ---
    test("contact form fields accept input", async ({ page }) => {
      await gotoReady(page, path);
      const form = page.locator("#contact form");
      await form.scrollIntoViewIfNeeded();
      await form.locator("input").first().fill("Test");
      await form.locator("textarea").click();
      await form.locator("textarea").fill("Hello");
      await form.locator('button[type="submit"]').click({ trial: true });
    });
  });
}

/** Clicks a range input at a fraction of its width, like a real pointer would (hit-tested by Playwright). */
async function clickSliderAt(page: Page, selector: string, fraction: number) {
  const slider = page.locator(selector);
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await slider.click({ position: { x: Math.max(2, box!.width * fraction), y: box!.height / 2 } });
}
