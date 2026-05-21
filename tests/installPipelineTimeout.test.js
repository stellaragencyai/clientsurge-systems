import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const installPipelineEntry = readFileSync(
  new URL("../base44/functions/installPipeline/entry.ts", import.meta.url),
  "utf8"
);

test("installPipeline request handler has a 30 second timeout guard", () => {
  assert.match(installPipelineEntry, /const INSTALL_PIPELINE_TIMEOUT_MS = 30_000;/);
  assert.match(installPipelineEntry, /function withInstallPipelineTimeout/);
  assert.match(installPipelineEntry, /Promise\.race\(\[promise, timeoutPromise\]\)/);
  assert.match(installPipelineEntry, /installPipeline request timed out after \$\{timeoutMs\}ms/);
  assert.match(installPipelineEntry, /status:\s*504/);
  assert.match(installPipelineEntry, /code:\s*"install_pipeline_timeout"/);
});

test("installPipeline timeout and runtime failures are logged consistently", () => {
  assert.match(installPipelineEntry, /function buildInstallPipelineErrorResponse/);
  assert.match(installPipelineEntry, /console\.error\("\[installPipeline\] request failed"/);
  assert.match(
    installPipelineEntry,
    /withInstallPipelineTimeout\(handleInstallPipelineRequest\(req\)\)\.catch/
  );
  assert.match(installPipelineEntry, /return buildInstallPipelineErrorResponse\(error\);/);
});
