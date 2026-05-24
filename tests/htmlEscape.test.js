import test from "node:test";
import assert from "node:assert/strict";

import { escapeAttribute, escapeHtml } from "../base44/functions/_shared/htmlEscape.js";

test("escapeHtml encodes user-controlled contact email fields", () => {
  assert.equal(
    escapeHtml(`Nolan <script>alert("x")</script> & Co`),
    "Nolan &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co"
  );
});

test("escapeAttribute protects quoted mailto attributes", () => {
  assert.equal(
    escapeAttribute(`lead@example.com" onclick="alert(1)`),
    "lead@example.com&quot; onclick=&quot;alert(1)"
  );
});
