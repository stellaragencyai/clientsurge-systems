import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/components/admin/AdminInbox.jsx", import.meta.url),
  "utf8"
);
const suggestReplySource = source.slice(
  source.indexOf("const handleSuggestReply"),
  source.indexOf("const handleSend")
);

test("AdminInbox AI draft calls generateAIReply without auto-sending", () => {
  assert.match(source, /handleSuggestReply/);
  assert.match(source, /base44\.functions\.invoke\("generateAIReply"/);
  assert.match(source, /source:\s*"admin_inbox_suggest_reply"/);
  assert.match(source, /setInput\(draft\)/);
  assert.doesNotMatch(suggestReplySource, /SupportMessage\.create/);
});

test("AdminInbox AI draft uses latest client message and conversation history", () => {
  assert.match(source, /latestClientMessage/);
  assert.match(source, /threadMessages\.slice\(-8\)/);
  assert.match(source, /conversation_history:\s*recentHistory/);
  assert.match(source, /inferIntentFromMessage\(latestClientMessage\.message\)/);
});
