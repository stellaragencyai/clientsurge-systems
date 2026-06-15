# Orchestration + Idempotency Layer for ClientSurge Systems

## Overview

This layer ensures all production workflows execute exactly once, in correct deterministic order, even under high traffic or repeated external webhook events.

## Core Components

### 1. Global Idempotency Layer (`IdempotencyKey` entity)

Every critical operation gets a unique idempotency key:

- **Order Processing**: `order_id`
- **Stripe Events**: `stripe_event_id`
- **Lead Events**: `{lead_id}_{event_type}`
- **Client Provisioning**: `client_id`
- **Webhook Handling**: `{provider}_{event_id}`

#### States
- `pending` → Just created, awaiting processing
- `processing` → Currently executing
- `completed` → Successfully finished (skip all future executions)
- `failed` → Failed once, can be retried
- `skipped` → Duplicate detected, skipped

#### Usage Pattern

```javascript
// Check/create idempotency key
const check = await checkIdempotencyKey(base44, 'order_123', 'order_processing', 'order', 'order_123', clientId);

if (check.skip_execution) {
  // This operation was already completed
  return { success: true, skipped: true };
}

// Mark as processing
markIdempotencyKeyProcessing(base44, check.key_id);

try {
  // Do actual work...
  markIdempotencyKeyCompleted(base44, check.key_id, resultHash);
} catch (error) {
  markIdempotencyKeyFailed(base44, check.key_id, error.message);
  throw error;
}
```

---

### 2. Orchestration Workflow (`OrchestrationWorkflow` entity)

Manages single-active-workflow guarantee per resource:

- Only **ONE** active workflow per `order_id`, `client_id`, or `client_project_id` at any time
- If duplicate workflow initiation detected → reuse existing workflow
- Tracks execution order, linked idempotency keys, and stage progress

#### Single-Active-Workflow Guarantee

```javascript
// On order_paid webhook (first time)
const workflow = await orchestrationController({
  resource_type: 'order',
  resource_id: order_id,
  workflow_type: 'order_to_onboarding',
  triggering_idempotency_key: stripe_event_id
});

// On order_paid webhook (duplicate)
// System detects active workflow for order_id
// Returns existing_workflow_id, skips re-execution
```

#### Deterministic Execution Order

Every workflow enforces this stage sequence:

1. **Billing Validation** → `billingProcessor`
   - Validate payment state
   - Check Stripe consistency

2. **Client Provisioning** → `client_provisioning`
   - Create/update Client entity
   - Assign business details

3. **Onboarding Initialization** → `onboarding_processor`
   - Create ClientProject
   - Initialize setup tasks

4. **Automation Activation** → `automationProcessor`
   - Enable automation rules
   - Trigger lead routing

5. **Messaging Triggers** → `messagingProcessor`
   - Send welcome SMS/email
   - Initialize contact flows

---

### 3. State Deduplication (`WorkflowStateHistory` entity)

Immutable audit trail of all state transitions:

- Prevents duplicate state application
- Tracks who changed what and when
- Detects replayed state changes

#### State Transition Tracking

```javascript
// Apply state change
const history = await trackStateTransition(
  base44,
  workflow_id,
  'order',          // resource_type
  'order_123',      // resource_id
  client_id,
  client_project_id,
  'Order',          // entity_type
  'pipeline_status', // field_name
  'Paid',           // from_value
  'Ready for Install', // to_value
  'billing_processor', // processor_type
  stripe_event_id   // idempotency_key
);

if (history.is_duplicate) {
  // State already applied, skip downstream actions
  console.log('State change already applied, skipping');
  return;
}
```

---

## Processor Integration

All processors now accept workflow context:

```javascript
POST /messagingProcessor

{
  "workflow_id": "workflow_123",
  "resource_type": "order",
  "resource_id": "order_456",
  "client_id": "client_789",
  "client_project_id": "project_999",
  "idempotency_key": "stripe_evt_123"
}
```

### Updated Processors

- `billingProcessor` - Validates payment, checks subscription state
- `client_provisioning` - Creates/updates Client entity
- `onboarding_processor` - Initializes ClientProject & setup
- `automationProcessor` - Executes automation rules
- `messagingProcessor` - Sends welcome/follow-up messages

---

## Admin Dashboard Integration

**Mission Control** can now view:

1. **Active Workflows**
   - By client/project/order
   - Current stage
   - Estimated completion time

2. **Idempotency Key Status**
   - All processed operations
   - Duplicate detection stats
   - Failed/retry queue

3. **State History**
   - Complete audit trail per workflow
   - Duplicates detected/skipped
   - State transition timeline

4. **Orchestration Health**
   - Queue depth per stage
   - Processing latency
   - Failure rates

---

## API Reference

### orchestrationController

```javascript
POST /orchestrationController

{
  "resource_type": "order|client|client_project|lead",
  "resource_id": "order_123",
  "client_id": "client_456",
  "client_project_id": "project_789",
  "workflow_type": "order_to_onboarding|client_lifecycle|project_provisioning",
  "triggering_idempotency_key": "stripe_evt_999"
}

Response:
{
  "success": true,
  "workflow_initiated": true,
  "workflow_id": "workflow_123",
  "reason": "new_workflow" | "active_workflow_exists",
  "existing_workflow_id": null
}
```

### workflowOrchestrator

```javascript
POST /workflowOrchestrator

{
  "workflow_id": "workflow_123",
  "resource_type": "order",
  "resource_id": "order_123",
  "client_id": "client_456",
  "client_project_id": "project_789",
  "workflow_type": "order_to_onboarding"
}

Response:
{
  "success": true,
  "stages_executed": 5,
  "stages_failed": 0,
  "execution_log": [
    {
      "stage": "billing_processor",
      "status": "completed",
      "timestamp": "2026-06-15T10:00:00Z"
    },
    ...
  ]
}
```

---

## Safety Guarantees

### ✅ No Duplicate Execution
- Idempotency keys prevent re-execution of completed operations
- Duplicate events reference existing workflow instead of creating new one

### ✅ Correct Execution Order
- Stages execute sequentially
- Next stage only starts after previous completes
- On failure, workflow halts before contaminating downstream

### ✅ State Consistency
- State transitions tracked immutably
- Duplicate state applications detected and skipped
- Complete audit trail for compliance

### ✅ Tenant Isolation
- All operations scoped to `client_id` + `client_project_id`
- No cross-tenant workflow contamination

### ✅ Backward Compatible
- Does NOT modify Cloudflare Worker
- Does NOT modify CommunicationEvent schema
- Does NOT alter Twilio/Stripe integrations
- Purely additive orchestration layer

---

## Migration Guide

### For Existing Webhook Handlers

Replace direct processor invocation:

```javascript
// OLD
await invokeProcessor('billingProcessor', event);

// NEW
const workflow = await base44.functions.invoke('orchestrationController', {
  resource_type: 'order',
  resource_id: order_id,
  client_id: client_id,
  workflow_type: 'order_to_onboarding',
  triggering_idempotency_key: stripe_event_id
});
```

### For Critical Operations

Wrap with idempotency:

```javascript
// Check idempotency
const check = await checkIdempotencyKey(
  base44,
  unique_key,
  'operation_type',
  'resource_type',
  resource_id,
  client_id
);

if (check.skip_execution) return;

// Process...

// Mark complete
await markIdempotencyKeyCompleted(base44, check.key_id);
```

---

## Monitoring

Track real-time orchestration health:

```javascript
GET /getScaleMetrics?client_id=client_123

{
  "queue_depth": 45,
  "workflow_count": 12,
  "idempotency_duplicates_detected": 8,
  "state_transitions_dedup_skipped": 3
}
``