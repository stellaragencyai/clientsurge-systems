/**
 * SYSTEM CONSISTENCY VALIDATOR
 * Validates data integrity across Leads, Orders, Messages, and CommunicationEvents
 * Used for pre-launch audits and ongoing health checks
 */

/**
 * Validate lead-to-order consistency
 */
export async function validateLeadOrderConsistency(base44, leadId) {
  try {
    const lead = await base44.entities.Leads.get(leadId);
    if (!lead) return { valid: false, error: 'Lead not found' };

    // If lead has linked order, verify order exists and links back
    if (lead.order_id) {
      const order = await base44.entities.Order.filter({ id: lead.order_id });
      if (!order || order.length === 0) {
        return {
          valid: false,
          error: 'Lead references non-existent order',
          lead_id: leadId,
          order_id: lead.order_id,
        };
      }

      // Verify funnel identity matches
      if (order[0].funnel_identity_id !== lead.funnel_identity_id) {
        return {
          valid: false,
          error: 'Funnel identity mismatch between lead and order',
          lead_funnel_id: lead.funnel_identity_id,
          order_funnel_id: order[0].funnel_identity_id,
        };
      }
    }

    // Verify all messages for this lead have matching funnel identity
    const messages = await base44.entities.Messages.filter({ lead_id: leadId });
    for (const msg of messages) {
      if (msg.funnel_identity_id !== lead.funnel_identity_id) {
        return {
          valid: false,
          error: 'Message funnel identity mismatch',
          message_id: msg.id,
          lead_funnel_id: lead.funnel_identity_id,
          message_funnel_id: msg.funnel_identity_id,
        };
      }
    }

    return { valid: true, checks_passed: 3 };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate order-to-subscription consistency
 */
export async function validateOrderSubscriptionConsistency(base44, orderId) {
  try {
    const order = await base44.entities.Order.get(orderId);
    if (!order) return { valid: false, error: 'Order not found' };

    // If order has linked subscription, verify subscription exists
    if (order.subscription_id || order.stripe_subscription_id) {
      const subId = order.subscription_id || order.stripe_subscription_id;
      const subscription = await base44.entities.Subscription.filter({ id: subId });

      if (!subscription || subscription.length === 0) {
        return {
          valid: false,
          error: 'Order references non-existent subscription',
          order_id: orderId,
          subscription_id: subId,
        };
      }

      // Verify funnel identity matches
      if (subscription[0].funnel_identity_id !== order.funnel_identity_id) {
        return {
          valid: false,
          error: 'Funnel identity mismatch between order and subscription',
          order_funnel_id: order.funnel_identity_id,
          subscription_funnel_id: subscription[0].funnel_identity_id,
        };
      }

      // Verify customer email matches
      if (subscription[0].customer_email !== order.customer_email) {
        return {
          valid: false,
          error: 'Customer email mismatch between order and subscription',
          order_email: order.customer_email,
          subscription_email: subscription[0].customer_email,
        };
      }
    }

    return { valid: true, checks_passed: 3 };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate communication event integrity
 */
export async function validateCommunicationEventIntegrity(base44, eventId) {
  try {
    const event = await base44.entities.CommunicationEvent.get(eventId);
    if (!event) return { valid: false, error: 'Event not found' };

    // If event has lead_id, verify lead exists
    if (event.lead_id) {
      const lead = await base44.entities.Leads.get(event.lead_id);
      if (!lead) {
        return {
          valid: false,
          error: 'Event references non-existent lead',
          event_id: eventId,
          lead_id: event.lead_id,
        };
      }

      // Verify funnel identity consistency
      if (event.funnel_identity_id && event.funnel_identity_id !== lead.funnel_identity_id) {
        return {
          valid: false,
          error: 'Event funnel identity mismatch with lead',
          event_funnel_id: event.funnel_identity_id,
          lead_funnel_id: lead.funnel_identity_id,
        };
      }
    }

    // Validate event structure
    const validStatuses = ['pending', 'sent', 'delivered', 'failed', 'opened', 'received', 'processed'];
    if (!validStatuses.includes(event.status)) {
      return {
        valid: false,
        error: 'Invalid event status',
        status: event.status,
      };
    }

    return { valid: true, checks_passed: 3 };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Batch validate consistency across dataset
 */
export async function validateDatasetConsistency(base44, sampleSize = 100) {
  const results = {
    total_records_checked: 0,
    valid_records: 0,
    invalid_records: 0,
    issues: [],
  };

  try {
    // Check leads
    const leads = await base44.entities.Leads.list(undefined, sampleSize);
    for (const lead of leads) {
      results.total_records_checked++;
      const check = await validateLeadOrderConsistency(base44, lead.id);
      if (!check.valid) {
        results.invalid_records++;
        results.issues.push({ type: 'lead', ...check });
      } else {
        results.valid_records++;
      }
    }

    // Check orders
    const orders = await base44.entities.Order.list(undefined, sampleSize);
    for (const order of orders) {
      results.total_records_checked++;
      const check = await validateOrderSubscriptionConsistency(base44, order.id);
      if (!check.valid) {
        results.invalid_records++;
        results.issues.push({ type: 'order', ...check });
      } else {
        results.valid_records++;
      }
    }

    return results;
  } catch (error) {
    return {
      ...results,
      error: error.message,
      status: 'failed',
    };
  }
}

/**
 * Validate attribution chain (lead → messages → order → revenue)
 */
export async function validateAttributionChain(base44, funnelIdentityId) {
  try {
    const chain = {
      funnel_identity_id: funnelIdentityId,
      lead: null,
      message_count: 0,
      order: null,
      subscription: null,
      revenue_total: 0,
      is_valid: true,
      issues: [],
    };

    // Find lead by funnel_identity_id
    const leads = await base44.entities.Leads.filter({
      funnel_identity_id: funnelIdentityId,
    });

    if (leads.length === 0) {
      chain.is_valid = false;
      chain.issues.push('No lead found for funnel identity');
      return chain;
    }

    chain.lead = leads[0];

    // Count messages
    const messages = await base44.entities.Messages.filter({
      funnel_identity_id: funnelIdentityId,
    });
    chain.message_count = messages.length;

    // Find order
    const orders = await base44.entities.Order.filter({
      funnel_identity_id: funnelIdentityId,
    });

    if (orders.length > 0) {
      chain.order = orders[0];
      chain.revenue_total = orders[0].total_setup || 0;

      // Find subscription if order exists
      if (orders[0].subscription_id) {
        const subs = await base44.entities.Subscription.filter({
          id: orders[0].subscription_id,
        });
        if (subs.length > 0) {
          chain.subscription = subs[0];
          chain.revenue_total += (subs[0].amount_monthly || 0);
        } else {
          chain.issues.push('Order references non-existent subscription');
          chain.is_valid = false;
        }
      }
    }

    return chain;
  } catch (error) {
    return {
      funnel_identity_id: funnelIdentityId,
      is_valid: false,
      error: error.message,
    };
  }
}

/**
 * Check for orphaned records
 */
export async function findOrphanedRecords(base44, entityName, foreignKeyField, targetEntity) {
  try {
    const orphans = [];
    const records = await base44.entities[entityName].list();

    for (const record of records) {
      const fkValue = record[foreignKeyField];
      if (!fkValue) continue; // Skip null foreign keys

      const targetRecord = await base44.entities[targetEntity].get(fkValue);
      if (!targetRecord) {
        orphans.push({
          record_id: record.id,
          orphaned_fk: fkValue,
          entity: entityName,
          foreign_key_field: foreignKeyField,
        });
      }
    }

    return {
      entity: entityName,
      total_records: records.length,
      orphaned_count: orphans.length,
      orphans: orphans.slice(0, 10), // Return top 10
    };
  } catch (error) {
    return {
      entity: entityName,
      error: error.message,
      status: 'check_failed',
    };
  }
}

export default {
  validateLeadOrderConsistency,
  validateOrderSubscriptionConsistency,
  validateCommunicationEventIntegrity,
  validateDatasetConsistency,
  validateAttributionChain,
  findOrphanedRecords,
};