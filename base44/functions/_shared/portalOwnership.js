function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function sortByCreatedDateDesc(a, b) {
  return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
}

function dedupeById(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) {
      return false;
    }

    seen.add(record.id);
    return true;
  });
}

async function safeFilter(collection, query, sort = "-created_date", limit = 25) {
  try {
    const results = await collection.filter(query, sort, limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function safeGet(collection, id) {
  if (!id) {
    return null;
  }

  try {
    return await collection.get(id);
  } catch {
    return null;
  }
}

function buildResolution(status, extras = {}) {
  return {
    status,
    ...extras,
  };
}

async function maybeBackfillProjectClientLink(base44, project, client) {
  if (!project?.id || !client?.id || project.client_id === client.id) {
    return project;
  }

  await base44.asServiceRole.entities.ClientProject.update(project.id, {
    client_id: client.id,
  });

  return safeGet(base44.asServiceRole.entities.ClientProject, project.id);
}

function buildResolvedPayload({
  project,
  client,
  order,
  resolutionType,
}) {
  return buildResolution("resolved", {
    resolution_type: resolutionType,
    project,
    client: client || null,
    order: order || null,
  });
}

export async function resolveClientPortalAccess({
  base44,
  userEmail,
}) {
  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!normalizedUserEmail) {
    return buildResolution("not_found", {
      code: "portal_user_email_missing",
    });
  }

  const [clientsByEmail, paidOrdersByEmail, projectsByEmail] = await Promise.all([
    safeFilter(base44.asServiceRole.entities.Client, { email: normalizedUserEmail }, "-created_date", 25),
    safeFilter(base44.asServiceRole.entities.Order, { customer_email: normalizedUserEmail }, "-created_date", 50),
    safeFilter(base44.asServiceRole.entities.ClientProject, { client_email: normalizedUserEmail }, "-created_date", 25),
  ]);

  const exactClients = dedupeById(
    clientsByEmail.filter((client) => normalizeEmail(client.email) === normalizedUserEmail)
  ).sort(sortByCreatedDateDesc);
  const uniqueClient = exactClients.length === 1 ? exactClients[0] : null;

  const linkedPaidOrders = paidOrdersByEmail
    .filter((order) => normalizeEmail(order.customer_email) === normalizedUserEmail)
    .filter((order) => order.payment_status === "paid" && order.client_project_id)
    .sort(sortByCreatedDateDesc);

  const linkedOrderCandidates = [];
  for (const order of linkedPaidOrders) {
    const project = await safeGet(base44.asServiceRole.entities.ClientProject, order.client_project_id);
    if (!project) {
      continue;
    }

    const linkedClient =
      (order.client_id && await safeGet(base44.asServiceRole.entities.Client, order.client_id)) ||
      uniqueClient;
    const hydratedProject =
      linkedClient && !project.client_id
        ? await maybeBackfillProjectClientLink(base44, project, linkedClient)
        : project;

    linkedOrderCandidates.push({
      order,
      project: hydratedProject || project,
      client: linkedClient || null,
    });
  }

  const uniqueLinkedProjects = dedupeById(linkedOrderCandidates.map((candidate) => candidate.project));
  if (uniqueLinkedProjects.length > 1) {
    return buildResolution("ambiguous", {
      code: "portal_project_ambiguous",
      resolution_type: "linked_paid_order_conflict",
    });
  }

  if (linkedOrderCandidates.length === 1) {
    return buildResolvedPayload({
      project: linkedOrderCandidates[0].project,
      client: linkedOrderCandidates[0].client,
      order: linkedOrderCandidates[0].order,
      resolutionType: "linked_paid_order",
    });
  }

  if (uniqueClient) {
    const projectsByClientId = dedupeById(
      await safeFilter(base44.asServiceRole.entities.ClientProject, { client_id: uniqueClient.id }, "-created_date", 25)
    ).sort(sortByCreatedDateDesc);

    if (projectsByClientId.length > 1) {
      return buildResolution("ambiguous", {
        code: "portal_project_ambiguous",
        resolution_type: "client_link_conflict",
      });
    }

    if (projectsByClientId.length === 1) {
      return buildResolvedPayload({
        project: projectsByClientId[0],
        client: uniqueClient,
        order: null,
        resolutionType: "client_id_link",
      });
    }
  }

  const exactEmailProjects = dedupeById(
    projectsByEmail.filter((project) => normalizeEmail(project.client_email) === normalizedUserEmail)
  ).sort(sortByCreatedDateDesc);

  if (exactEmailProjects.length > 1) {
    return buildResolution("ambiguous", {
      code: "portal_project_ambiguous",
      resolution_type: "legacy_email_conflict",
    });
  }

  if (exactEmailProjects.length === 1) {
    const legacyProject = exactEmailProjects[0];
    const linkedProject =
      uniqueClient && !legacyProject.client_id
        ? await maybeBackfillProjectClientLink(base44, legacyProject, uniqueClient)
        : legacyProject;

    return buildResolvedPayload({
      project: linkedProject || legacyProject,
      client: uniqueClient,
      order: null,
      resolutionType:
        uniqueClient && !legacyProject.client_id
          ? "legacy_email_backfilled"
          : "legacy_email_match",
    });
  }

  return buildResolution("not_found", {
    code: "portal_project_not_found",
  });
}
