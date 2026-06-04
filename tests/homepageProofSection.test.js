import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const proofSection = readFileSync(
  new URL("../src/components/landing/ProofBeforeLaunch.jsx", import.meta.url),
  "utf8"
);

test("proof section gives concrete launch proof without fake case studies", () => {
  assert.match(proofSection, /Proof before launch/);
  assert.match(proofSection, /Example SMS conversation/);
  assert.match(proofSection, /Before and after workflow/);
  assert.match(proofSection, /Dashboard visibility/);
  assert.match(proofSection, /"Paid order", "Install workspace", "Tested services", "Live status"/);
  assert.match(proofSection, /<ArrowRight/);
  assert.doesNotMatch(proofSection, /case stud/i);
});
