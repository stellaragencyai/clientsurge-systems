/**
 * Portal Ownership Resolution
 * Resolves which ClientProject / Order a user has access to in the client portal.
 */

/**
 * Resolve client portal access for a given user email.
 * Returns { status: "resolved"|"not_found", order?: Order, clientProject?: ClientProject }
 */
export async function resolveClientPortalAccess({ base44, userEmail }) {
  if (!userEmail) {
    return { status: "not_found", order: null, clientProject: null };
  }

  try {
    // Try to find a ClientProject by client_email
    const projects = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: userEmail },
      "-created_date",
      5
    ).catch(() => []);

    if (projects && projects.length > 0) {
      const project = projects[0];
      // Try to find a linked order
      let order = null;
      if (project.client_id) {
        const orders = await base44.asServiceRole.entities.Order.filter(
          { client_id: project.client_id },
          "-created_date",
          1
        ).catch(() => []);
        order = orders?.[0] || null;
      }

      return { status: "resolved", order, clientProject: project };
    }

    // Fallback: try to find an Order by customer_email
    const orders = await base44.asServiceRole.entities.Order.filter(
      { customer_email: userEmail },
      "-created_date",
      1
    ).catch(() => []);

    if (orders && orders.length > 0) {
      return { status: "resolved", order: orders[0], clientProject: null };
    }

    return { status: "not_found", order: null, clientProject: null };
  } catch (error) {
    console.warn("[portalOwnership] Error resolving access:", error.message);
    return { status: "not_found", order: null, clientProject: null };
  }
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));