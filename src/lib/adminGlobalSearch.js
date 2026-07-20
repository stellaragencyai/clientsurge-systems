import {
  PLATFORM_SEARCH_SOURCES,
  buildPlatformSearchResults,
  getPlatformSearchPlaceholder,
} from "./platformIntegrationFoundation.js";

const DEFAULT_SEARCH_ENTITY_LIMIT = 200;
const SOURCE_ENTITY_LIMITS = {
  settings: 50,
};

function getEntityLimit(source, options = {}) {
  return options.sourceLimits?.[source.id] ?? SOURCE_ENTITY_LIMITS[source.id] ?? options.entityLimit ?? DEFAULT_SEARCH_ENTITY_LIMIT;
}

async function listSearchEntity(base44Client, entityName, limit) {
  const entity = base44Client?.entities?.[entityName];

  if (!entity?.list) {
    return {
      entity: entityName,
      status: "Unavailable",
      records: [],
      reason: "missing_entity",
    };
  }

  try {
    const records = await entity.list("-created_date", limit);
    return {
      entity: entityName,
      status: "Current",
      records: Array.isArray(records) ? records : [],
      reason: null,
    };
  } catch (error) {
    return {
      entity: entityName,
      status: "Unavailable",
      records: [],
      reason: error?.message || "entity_list_failed",
    };
  }
}

function summarizeSourceStatus(source, entityResults) {
  const currentEntities = entityResults.filter((result) => result.status === "Current").map((result) => result.entity);
  const unavailableEntities = entityResults.filter((result) => result.status !== "Current").map((result) => result.entity);
  const recordCount = entityResults.reduce((count, result) => count + result.records.length, 0);
  const status = currentEntities.length === 0 ? "Unavailable" : unavailableEntities.length > 0 ? "Partial" : "Current";

  return {
    sourceId: source.id,
    status,
    entities: source.entities,
    currentEntities,
    unavailableEntities,
    recordCount,
  };
}

export function getAdminGlobalSearchAdapterPlan(options = {}) {
  const sourceIds = options.sourceIds ? new Set(options.sourceIds) : null;

  return PLATFORM_SEARCH_SOURCES
    .filter((source) => !sourceIds || sourceIds.has(source.id))
    .map((source) => ({
      sourceId: source.id,
      recordKey: source.id,
      entities: source.entities,
      limit: getEntityLimit(source, options),
    }));
}

export async function loadAdminGlobalSearchRecords(base44Client, options = {}) {
  const sourcesById = new Map(PLATFORM_SEARCH_SOURCES.map((source) => [source.id, source]));
  const entries = await Promise.all(
    getAdminGlobalSearchAdapterPlan(options).map(async (planItem) => {
      const source = sourcesById.get(planItem.sourceId);
      const entityResults = await Promise.all(
        planItem.entities.map((entityName) => listSearchEntity(base44Client, entityName, planItem.limit)),
      );
      const records = entityResults.flatMap((result) => result.records);
      return [planItem.sourceId, records, summarizeSourceStatus(source, entityResults)];
    }),
  );

  return {
    recordsBySource: Object.fromEntries(entries.map(([sourceId, records]) => [sourceId, records])),
    sourceStatuses: Object.fromEntries(entries.map(([sourceId, _records, status]) => [sourceId, status])),
  };
}

export function buildAdminGlobalSearchResults(entityRecords, query, maxResults = 12, options = {}) {
  return buildPlatformSearchResults(entityRecords, query, maxResults, {
    sourceStatuses: options.sourceStatuses,
  });
}

export {
  getPlatformSearchPlaceholder as getAdminGlobalSearchPlaceholder,
};
