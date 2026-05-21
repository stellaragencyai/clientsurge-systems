import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildResponsiveImageProps, optimizeImageUrl } from "../src/lib/imageOptimization.js";

test("optimizeImageUrl adds bounded Unsplash params without touching other CDNs", () => {
  const optimized = optimizeImageUrl("https://images.unsplash.com/photo-abc?w=1200&q=95", {
    width: 800,
    quality: 80,
  });

  assert.equal(optimized, "https://images.unsplash.com/photo-abc?w=800&q=80&fit=crop&auto=format");
  assert.equal(
    optimizeImageUrl("https://media.base44.com/images/public/logo.png", { width: 800 }),
    "https://media.base44.com/images/public/logo.png",
  );
});

test("buildResponsiveImageProps creates srcSet and sizes for responsive images", () => {
  const props = buildResponsiveImageProps("https://images.unsplash.com/photo-abc", {
    widths: [480, 800, 1200],
    sizes: "100vw",
  });

  assert.match(props.src, /w=800/);
  assert.match(props.srcSet, /w=480&q=80&fit=crop&auto=format 480w/);
  assert.match(props.srcSet, /w=1200&q=80&fit=crop&auto=format 1200w/);
  assert.equal(props.sizes, "100vw");
});

test("public industry and process images use responsive optimization props", () => {
  const files = [
    "src/components/industry/IndustryHero.jsx",
    "src/components/landing/Industries.jsx",
    "src/components/landing/IndustryModal.jsx",
    "src/components/landing/DetailedProcess.jsx",
    "src/components/landing/coreOffer/LaunchTimeline.jsx",
  ];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /buildResponsiveImageProps/, `${file} should build responsive image props`);
    assert.match(source, /\{\.\.\.imageProps\}/, `${file} should spread responsive image props onto img`);
  }
});
