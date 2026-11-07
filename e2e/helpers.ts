import { expect, type Page } from "@playwright/test";

export const SECTIONS = ["top", "about", "lab", "experience", "skills", "projects", "contact"] as const;
export const PAGES = [
  { name: "fa", path: "/" },
  { name: "en", path: "/en" },
] as const;

/** Opens a page and waits until the 3D world is really running (otherwise the overlay bugs cannot show). */
export async function gotoReady(page: Page, path: string) {
  // CI runners often expose only 2 cores, which the app (correctly) treats as a
  // weak device and answers with the 2D fallback. Pretend to be a normal machine
  // so the 3D overlay — the thing under test — is really present.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
  });
  await page.goto(path);
  await expect(
    page.locator("html"),
    "3D world must be active in this browser, otherwise these tests prove nothing"
  ).toHaveAttribute("data-world", "active", { timeout: 30_000 }).catch(async (error) => {
    const reason = await page.locator("html").getAttribute("data-world-reason");
    throw new Error(`3D world did not start (fallback reason: ${reason ?? "unknown"})\n${error}`);
  });
  await expect(page.locator(".world-layer[data-ready]")).toHaveCount(1, { timeout: 30_000 });
}

export interface Blocked {
  element: string;
  coveredBy: string;
}

/**
 * Hit-tests every interactive element under `rootSelector`: scrolls it to the
 * middle of the viewport and asks the browser what is really on top at its
 * centre. Anything other than the element itself (or a child) means a real
 * pointer would not reach it.
 */
export async function findBlocked(page: Page, rootSelector: string): Promise<Blocked[]> {
  return page.evaluate(async (selector) => {
    const describe = (node: Element | null) => {
      if (!node) return "nothing";
      const cls = typeof node.className === "string" ? node.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
      return `${node.tagName.toLowerCase()}${node.id ? "#" + node.id : ""}${cls ? "." + cls : ""}`;
    };
    const root = document.querySelector(selector);
    if (!root) return [{ element: selector, coveredBy: "root not found" }];

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), textarea, select, summary")
    );
    const blocked: { element: string; coveredBy: string }[] = [];

    for (const el of items) {
      // Radio inputs are visually hidden; the visible target is their label.
      const target = el.matches("input[type=radio], input[type=checkbox]")
        ? (el.closest("label") as HTMLElement | null)
        : el;
      if (!target || !target.checkVisibility()) continue;

      target.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 120));

      const rect = target.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const fractions = el.matches("input[type=range]") ? [0.08, 0.5, 0.92] : [0.5];

      for (const f of fractions) {
        const x = rect.left + rect.width * f;
        const y = rect.top + rect.height / 2;
        if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(target === hit || target.contains(hit))) {
          const text = (el.textContent ?? "").trim().slice(0, 24);
          blocked.push({ element: `${describe(el)}${text ? ` "${text}"` : ""}`, coveredBy: describe(hit) });
          break;
        }
      }
    }
    return blocked;
  }, rootSelector);
}
