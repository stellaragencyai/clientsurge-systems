#!/usr/bin/env node

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_START_URL,
  importantRouteUrls,
  isInternalUrl,
  normalizeUrl,
  parseArgs,
} from "./audit-page.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(auditRoot, "reports", "crawl.json");
const SKIP_PATH_PATTERN = /\.(pdf|zip|jpg|jpeg|png|gif|webp|svg|css|js|mp4|mov|avi|webm|xml)$/i;
const PRIVATE_PATH_PATTERN = /\/(admin|dashboard|setup|portal|internal|operator|openclaw|api)(\/|$|\?)/i;

export async function crawlSite(options = {}) {
  const startUrl = normalizeUrl(options.startUrl ?? DEFAULT_START_URL);
  const maxPages = Number(options.maxPages ?? 40);
  const browser = options.browser ?? (await chromium.launch({ headless: true }));
  const ownsBrowser = !options.browser;
  const queue = [startUrl];
  const seen = new Set();
  const pages = [];
  const skippedPrivate = [];
  const errors = [];

  while (queue.length && pages.length < maxPages) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      const response = await page.goto(current, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(600);
      const finalUrl = normalizeUrl(page.url(), startUrl) ?? page.url();
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((anchor) => ({
            text: (anchor.innerText || anchor.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(),
            href: anchor.getAttribute("href"),
            url: new URL(anchor.getAttribute("href"), location.href).toString(),
          }))
          .filter((link) => link.url.startsWith("http://") || link.url.startsWith("https://"))
      );

      const normalizedLinks = [];
      for (const link of links) {
        const normalized = normalizeUrl(link.url, startUrl);
        if (!normalized || !isInternalUrl(normalized, startUrl) || SKIP_PATH_PATTERN.test(new URL(normalized).pathname)) {
          continue;
        }
        if (PRIVATE_PATH_PATTERN.test(new URL(normalized).pathname)) {
          skippedPrivate.push({ from: current, text: link.text, url: normalized });
          continue;
        }
        normalizedLinks.push({ ...link, url: normalized });
        if (!seen.has(normalized) && !queue.includes(normalized) && pages.length + queue.length < maxPages * 2) {
          queue.push(normalized);
        }
      }

      pages.push({
        url: current,
        finalUrl,
        status: response?.status() ?? null,
        title: await page.title(),
        discoveredLinks: uniqueByUrl(normalizedLinks),
      });
    } catch (error) {
      errors.push({ url: current, error: error.message });
    } finally {
      await page.close();
    }
  }

  if (ownsBrowser) {
    await browser.close();
  }

  const discoveredUrls = new Set(pages.map((page) => page.finalUrl || page.url));
  for (const importantUrl of importantRouteUrls(startUrl)) {
    if (!PRIVATE_PATH_PATTERN.test(new URL(importantUrl).pathname)) {
      discoveredUrls.add(importantUrl);
    }
  }

  return {
    startUrl,
    crawledAt: new Date().toISOString(),
    maxPages,
    discoveredUrls: Array.from(discoveredUrls).sort(),
    pages,
    skippedPrivate: uniqueByUrl(skippedPrivate),
    errors,
  };
}

function uniqueByUrl(links) {
  const seen = new Set();
  const output = [];
  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    output.push(link);
  }
  return output;
}

async function main() {
  const args = parseArgs();
  const result = await crawlSite({
    startUrl: args.start ?? DEFAULT_START_URL,
    maxPages: args["max-pages"] ?? 40,
  });
  const out = resolve(process.cwd(), args.out ?? DEFAULT_OUT);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
