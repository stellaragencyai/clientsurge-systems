import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bookSource = readFileSync("src/pages/Book.jsx", "utf8");

test("book page embeds the Calendly scheduler with mobile-safe iframe sizing", () => {
  assert.match(bookSource, /const BOOKING_EMBED_URL = "https:\/\/calendly\.com\/nolan-clientsurgesystems"/);
  assert.match(bookSource, /<iframe/);
  assert.match(bookSource, /src=\{BOOKING_EMBED_URL\}/);
  assert.match(bookSource, /title="ClientSurge audit scheduler"/);
  assert.match(bookSource, /width="100%"/);
  assert.match(bookSource, /height="700"/);
  assert.match(bookSource, /scrolling="yes"/);
  assert.match(bookSource, /className="block w-full border-0"/);
  assert.match(bookSource, /id="scheduler"/);
  assert.match(bookSource, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.doesNotMatch(bookSource, /DemoBookingModal/);
});
