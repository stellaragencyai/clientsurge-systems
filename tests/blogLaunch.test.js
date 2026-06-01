import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const blog = readFileSync("src/pages/Blog.jsx", "utf8");
const industryTemplate = readFileSync("src/components/landing/IndustryTemplate.jsx", "utf8");
const sitemap = readFileSync("public/sitemap.xml", "utf8");

const launchArticleSlugs = [
  "missed-call-text-back-guide",
  "ai-lead-follow-up-automation",
  "med-spa-lead-response-automation",
  "dental-missed-call-automation",
  "contractor-lead-follow-up-system",
  "hvac-missed-call-text-back",
  "roofing-lead-response-automation",
  "ai-appointment-booking-local-business",
  "lead-response-speed-to-lead",
  "automation-package-comparison",
];

test("launch blog keeps all article URLs indexed", () => {
  for (const slug of launchArticleSlugs) {
    assert.match(blog, new RegExp(`slug: "${slug}"`));
    assert.match(sitemap, new RegExp(`https://clientsurgesystems\\.com/blog/${slug}`));
  }
});

test("blog index keeps topic filters for mobile scannability", () => {
  for (const topic of ["All", "Lead Capture", "Industries", "Booking", "Strategy"]) {
    assert.match(blog, new RegExp(`label: "${topic}"`));
  }

  assert.match(blog, /aria-label="Filter blog guides by topic"/);
  assert.match(blog, /overflow-x-auto/);
  assert.match(blog, /const filteredPosts = useMemo/);
  assert.match(blog, /activeFilter\.tags\.includes\(post\.tag\)/);
});

test("blog articles keep launch SEO schema hooks", () => {
  assert.match(blog, /setJsonLd\(`article-\$\{post\.slug\}`/);
  assert.match(blog, /setJsonLd\(`article-faq-\$\{post\.slug\}`/);
  assert.match(blog, /canonicalPath: `\/blog\/\$\{post\.slug\}`/);
});

test("industry pages link back to matching launch blog guides", () => {
  for (const [industry, slug] of [
    ["med-spa", "med-spa-lead-response-automation"],
    ["dental", "dental-missed-call-automation"],
    ["contractors", "contractor-lead-follow-up-system"],
    ["hvac", "hvac-missed-call-text-back"],
    ["roofing", "roofing-lead-response-automation"],
    ["chiropractic", "ai-appointment-booking-local-business"],
  ]) {
    const keyPattern = industry.includes("-") ? `"${industry}"` : industry;
    assert.match(industryTemplate, new RegExp(`${keyPattern}: \\{`));
    assert.match(industryTemplate, new RegExp(`/blog/${slug}`));
  }

  assert.match(industryTemplate, /Related launch guide/);
  assert.match(industryTemplate, /Read guide/);
});
