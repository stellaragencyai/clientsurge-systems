export const COMMUNICATION_LOG_PAGE_SIZE = 100;

export function getCommunicationLogOffset({ page = 0, pageSize = COMMUNICATION_LOG_PAGE_SIZE } = {}) {
  const numericPage = Number.isFinite(Number(page)) ? Number(page) : 0;
  const numericPageSize = Number.isFinite(Number(pageSize)) ? Number(pageSize) : COMMUNICATION_LOG_PAGE_SIZE;
  return Math.max(0, Math.floor(numericPage)) * Math.max(1, Math.floor(numericPageSize));
}

export function getCommunicationLogFetchLimit({ page = 0, pageSize = COMMUNICATION_LOG_PAGE_SIZE } = {}) {
  return getCommunicationLogOffset({ page, pageSize }) + Math.max(1, Math.floor(pageSize)) + 1;
}

export function getCommunicationLogPage(results, { page = 0, pageSize = COMMUNICATION_LOG_PAGE_SIZE } = {}) {
  if (!Array.isArray(results)) return [];
  const offset = getCommunicationLogOffset({ page, pageSize });
  return results.slice(offset, offset + pageSize);
}

export function hasNextCommunicationLogPage(results, pageSize = COMMUNICATION_LOG_PAGE_SIZE) {
  return Array.isArray(results) && results.length === pageSize;
}
