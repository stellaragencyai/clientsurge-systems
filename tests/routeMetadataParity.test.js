import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import {
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_METADATA,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function normalizeLiteral(value) {
  return JSON.parse(JSON.stringify(value));
}

function extractLiteral(source, variableName, nextToken) {
  const regex = new RegExp(`var ${variableName} = ([\\s\\S]*?);\\s*var ${nextToken} =`);
  const match = source.match(regex);
  assert.ok(match, `Could not find inline ${variableName} literal in index.html`);
  return normalizeLiteral(vm.runInNewContext(`(${match[1]})`));
}

test("index.html static route map matches the shared public route metadata source", () => {
  const routeMap = extractLiteral(indexHtml, "routeMap", "aliases");
  assert.deepEqual(routeMap, PUBLIC_ROUTE_METADATA);
});

test("index.html static aliases match the shared alias source", () => {
  const aliases = extractLiteral(indexHtml, "aliases", "noindexPrefixes");
  assert.deepEqual(aliases, STATIC_ROUTE_ALIASES);
});

test("index.html noindex prefixes match the shared route metadata source", () => {
  const noindexPrefixes = extractLiteral(indexHtml, "noindexPrefixes", "path");
  assert.deepEqual(
    [...noindexPrefixes].sort(),
    [...NOINDEX_ROUTE_PREFIXES].sort()
  );
});
