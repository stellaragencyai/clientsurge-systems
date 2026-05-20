import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMUNICATION_LOG_PAGE_SIZE,
  getCommunicationLogFetchLimit,
  getCommunicationLogOffset,
  getCommunicationLogPage,
  hasNextCommunicationLogPage,
} from "../src/lib/communicationLogPagination.js";

test("communication log offset is page-size based and clamps invalid values", () => {
  assert.equal(COMMUNICATION_LOG_PAGE_SIZE, 100);
  assert.equal(getCommunicationLogOffset({ page: 0 }), 0);
  assert.equal(getCommunicationLogOffset({ page: 2 }), 200);
  assert.equal(getCommunicationLogOffset({ page: -1 }), 0);
  assert.equal(getCommunicationLogOffset({ page: "3", pageSize: 25 }), 75);
  assert.equal(getCommunicationLogFetchLimit({ page: 3, pageSize: 25 }), 101);
});

test("communication log page slices fetched records for the requested page", () => {
  const rows = Array.from({ length: 75 }, (_, index) => ({ id: index + 1 }));

  assert.deepEqual(getCommunicationLogPage(rows, { page: 0, pageSize: 25 }).map((row) => row.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
  assert.deepEqual(getCommunicationLogPage(rows, { page: 2, pageSize: 25 }).map((row) => row.id), [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]);
});

test("communication log pagination treats a full page as a possible next page", () => {
  assert.equal(hasNextCommunicationLogPage(Array.from({ length: 100 })), true);
  assert.equal(hasNextCommunicationLogPage(Array.from({ length: 99 })), false);
  assert.equal(hasNextCommunicationLogPage(null), false);
});
