/**
 * Organize Pipeline Queue
 * Scheduled: Every 15 minutes
 * Purpose: Route orders through install queue, assign to team members, organize by priority
 * 
 * Workflow:
 * 1. Find orders in "Configuring" or "Testing" state
 * 2. Organize by priority (high-touch clients, service complexity)
 * 3. Route to available team member based on capacity
 * 4. Update client project assignment
 * 5. Notify team of new assignments
 * 6. Track queue metrics
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

async function getTeamMembers(base44) {
  try {
    const users = await base44.asServiceRole.entities.User.list("-created_date", 100);
    return (users || [])
      .filter((u) => u.role === "admin" || (Array.isArray(u.role) && u.role.includes("admin")))
      .slice(0, 10); // Limit to 10 team members
  } catch {
    return [];
  }
}

async function getActiveAssignments(base44, email) {
  try {
    const projects = await base44.asServiceRole.entities.ClientProject.filter(
      { assigned_to: email },
      "-created_date",
      100
    );
    return projects || [];
  } catch {
    return [];
  }
}

function calculatePriority(order) {
  let score = 0;

  // Higher priority for multi-service orders
  if (order.items?.length >= 3) score += 10;
  if (order.items?.length === 2) score += 5;

  // Higher priority for higher-value orders
  if (order.total_price >= 5000) score += 15;
  if (order.total_price >= 2000) score += 10;

  // Older orders get higher priority (time-based escalation)
  if (order.install_initialized_at) {
    const age = Date.now() - new Date(order.install_initialized_at).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days > 3) score += 20;
    if (days > 1) score += 10;
  }

  return score;
}

async function assignToTeamMember(base44, order, teamMembers) {
  if (!teamMembers?.length) {
    return null; // No team members available
  }

  // Find team member with lowest current load
  let bestMember = null;
  let lowestLoad = Infinity;

  for (const member of teamMembers) {
    const assignments = await getActiveAssignments(base44, member.email);
    if (assignments.length < lowestLoad) {
      lowestLoad = assignments.length;
      bestMember = member;
    }
  }

  return bestMember;
}

async function notifyTeamAssignment(base44, order, assignee) {
  const serviceList = order.items?.map((i) => i.product_name).join(", ") || "Services";

  const subject = `New Client Onboarding: ${order.business_name}`;
  const body = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <h2 style="color: #9a5c2e;">New Client Assigned</h2>
  <p>You have a new client onboarding in your queue:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background: #f5f5f5;">
      <td style="padding: 10px; font-weight: 600;">Business</td>
      <td style="padding: 10px;">${order.business_name}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: 600;">Contact</td>
      <td style="padding: 10px;">${order.customer_name} (${order.customer_email})</td>
    </tr>
    <tr style="background: #f5f5f5;">
      <td style="padding: 10px; font-weight: 600;">Services</td>
      <td style="padding: 10px;">${serviceList}</td>
    </tr>
    <tr>
      <td style="padding: 10px; font-weight: 600;">Status</td>
      <td style="padding: 10px; color: #3b82f6; font-weight: 600;">${order.pipeline_status}</td>
    </tr>
  </table>
  
  <p style="margin: 20px 0; color: #555;">
    <strong>Next Steps:</strong> Review the client's configuration, validate all services are provisioned, and move to Testing.
  </p>
  
  <a href="https://dashboard.clientsurgesystems.com/admin" style="display: inline-block; background: #9a5c2e; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
    View in Dashboard →
  </a>
</div>`;

  // Send to admin notification email if available, otherwise to team member
  const notifyEmail =
    Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || assignee?.email;

  if (notifyEmail) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: notifyEmail,
      subject,
      body,
      from_name: "ClientSurge Pipeline",
    });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled automation (no auth required)
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get team members
    const teamMembers = await getTeamMembers(base44);
    if (!teamMembers?.length) {
      return Response.json({
        success: true,
        organized: 0,
        assigned: 0,
        message: "No team members available for assignments",
      });
    }

    // Find orders in active pipeline states
    const organizingOrders = await base44.asServiceRole.entities.Order.filter(
      { pipeline_status: { $in: ["Configuring", "Testing"] } },
      "-install_initialized_at",
      200
    );

    if (!organizingOrders?.length) {
      return Response.json({
        success: true,
        organized: 0,
        assigned: 0,
        message: "No orders to organize",
      });
    }

    // Sort by priority
    const prioritizedOrders = organizingOrders.sort(
      (a, b) => calculatePriority(b) - calculatePriority(a)
    );

    const results = {
      organized: 0,
      assigned: 0,
      notified: 0,
      failed: 0,
      queue_snapshot: [],
    };

    for (const order of prioritizedOrders) {
      try {
        // Calculate priority
        const priority = calculatePriority(order);

        // Skip if already assigned recently
        if (order.assigned_to && order.assigned_at) {
          const timeSinceAssign = Date.now() - new Date(order.assigned_at).getTime();
          if (timeSinceAssign < 3600000) {
            // 1 hour
            results.queue_snapshot.push({
              order_id: order.id,
              business: order.business_name,
              status: order.pipeline_status,
              priority,
              assigned_to: order.assigned_to,
              recently_assigned: true,
            });
            results.organized++;
            continue;
          }
        }

        // Assign to team member
        const assignee = await assignToTeamMember(base44, order, teamMembers);
        if (assignee) {
          await base44.asServiceRole.entities.Order.update(order.id, {
            assigned_to: assignee.email,
            assigned_at: new Date().toISOString(),
          });

          // Notify team
          await notifyTeamAssignment(base44, order, assignee);

          results.assigned++;
          results.notified++;

          // Log event
          await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: null,
            channel: "internal",
            direction: "system",
            event_type: "workflow_triggered",
            provider: "internal",
            status: "processed",
            subject: `Order ${order.id} assigned to ${assignee.email}`,
            message_body: `Client ${order.business_name} routed to team member for onboarding`,
            metadata_json: JSON.stringify({
              order_id: order.id,
              assigned_to: assignee.email,
              priority,
              timestamp: new Date().toISOString(),
            }),
          });

          console.log(`[Pipeline] Assigned order ${order.id} to ${assignee.email}`);
        }

        results.queue_snapshot.push({
          order_id: order.id,
          business: order.business_name,
          status: order.pipeline_status,
          priority,
          assigned_to: assignee?.email || "unassigned",
        });

        results.organized++;
      } catch (error) {
        console.error(`[Pipeline] Error organizing ${order.id}:`, error.message);
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("[Pipeline] Fatal error:", error.message);
    return Response.json(
      { error: error.message || "Failed to organize pipeline" },
      { status: 500 }
    );
  }
});