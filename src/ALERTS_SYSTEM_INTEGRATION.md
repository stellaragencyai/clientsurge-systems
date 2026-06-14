# Real-Time Alerts System Integration Guide

## Overview
The Alerts System automatically triggers notifications when high-intent leads/conversations arrive. Admins see instant alerts in Mission Control Dashboard.

## Components Created

### 1. Alert Entity (`entities/Alert.json`)
Stores all alert records with metadata:
- **type**: lead, booking, support, system
- **priority**: high, medium, low
- **intent**: booking, pricing, support, question, etc.
- **notification_channels**: toast, email, sms (what was sent)
- **read_status**: track admin acknowledgment

### 2. AlertsPanel Component (`components/mission-control/AlertsPanel.jsx`)
- Real-time alert feed (3-second polling)
- Filter by type and priority
- Mark as read / dismiss actions
- Status indicator showing LIVE/CONNECTING/OFFLINE
- "Last updated X seconds ago" timestamps

### 3. useRealtimeAlerts Hook (`hooks/useRealtimeAlerts.js`)
- 3-second polling with delta updates (only new records)
- Exponential backoff on failure (1s, 2s, 4s, 8s, max 30s)
- Auto-retry on network failure
- Functions: `fetchAlerts()`, `markAsRead()`, `dismissAlert()`
- Returns: alerts[], status, isLoading, error

### 4. alertTrigger Backend Function (`functions/alertTrigger.js`)
- Called asynchronously when high-intent events occur
- Creates Alert records in database
- Sends notifications (email + high-priority SMS)
- **Non-blocking** — doesn't wait for notifications, returns immediately
- Fails gracefully if notification channel unavailable

### 5. SystemStatusIndicator Component (`components/mission-control/SystemStatusIndicator.jsx`)
- Shows LIVE (green) / CONNECTING (blue) / OFFLINE (red) status
- Health checks every 10 seconds
- Pulses while connecting

## Integration Points

### Triggering Alerts from Webhook Handlers

When a high-intent lead arrives (via Twilio webhook, ConversationThread creation, etc.), call:

```javascript
// In your webhook handler
const isHighIntent = message.toLowerCase().includes("book") || 
                    message.toLowerCase().includes("urgent") ||
                    intent === "booking";

if (isHighIntent) {
  // Fire async alert trigger (non-blocking)
  base44.functions.invoke("alertTrigger", {
    trigger_type: "twilio",  // or "webhook", "worker"
    lead_id: leadId,
    conversation_id: conversationId,
    phone_number: phoneNumber,
    intent: detectedIntent,  // e.g., "booking", "pricing", "support"
    message: userMessage,
  }).catch(err => console.error("Alert failed:", err));
}
```

### From ConversationThread Creation
Add to any automation/function that creates ConversationThread:

```javascript
const convo = await base44.entities.ConversationThread.create({
  lead_id: leadId,
  primary_channel: "sms",
  // ...
});

// Trigger alert if high intent
if (isBookingOrUrgent(message)) {
  base44.functions.invoke("alertTrigger", {
    trigger_type: "webhook",
    conversation_id: convo.id,
    phone_number: phoneNumber,
    intent: "booking",
    message: message,
  }).catch(err => console.error("[Alert] Failed:", err));
}
```

## Real-Time Behavior

1. **Detection** — High-intent event occurs (lead arrives, booking requested, urgent message)
2. **Alert Creation** — `alertTrigger` creates Alert record instantly (< 1 second)
3. **Polling** — `useRealtimeAlerts` hook polls every 3 seconds
4. **UI Update** — New alerts appear in AlertsPanel within 3-5 seconds
5. **Notifications** — Email sent immediately; SMS sent for high-priority only
6. **Admin Action** — Admin clicks "Read" or "Dismiss" to acknowledge

## Configuration

### Polling Interval
Edit `useRealtimeAlerts.js` to change polling speed:
```javascript
useRealtimeAlerts({ pollInterval: 3000 })  // 3 seconds (default)
```

### High-Intent Keywords
Edit `alertTrigger.js` to add/remove triggers:
```javascript
const keywords = ["book", "booking", "urgent", "asap", "now", "today", "price"];
```

### Notification Channels
In `alertTrigger.js`, enable/disable notifications:
```javascript
// Always send email (if available)
if (adminEmail) { ... }

// SMS only for high-priority alerts
if (adminPhone && alert.priority === "high") { ... }

// Toast always (auto-polled in dashboard)
channels.push("toast");
```

## Database Queries

### Get unread alerts
```javascript
const unread = await base44.entities.Alert.filter({ read_status: false });
```

### Get alerts from last 1 hour
```javascript
const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
const recent = await base44.entities.Alert.filter({
  created_date: { $gt: oneHourAgo }
});
```

### Get high-priority booking alerts
```javascript
const urgent = await base44.entities.Alert.filter({
  type: "booking",
  priority: "high"
});
```

## Error Handling

- **Network timeout on polling** — Auto-retry with exponential backoff
- **Email/SMS fails** — Alert still created; notification channel skipped silently
- **Database unavailable** — AlertsPanel shows "OFFLINE"; reconnects automatically
- **Webhook handler crashes** — Alert trigger is async, won't break webhook

## Performance Notes

- Delta fetching (only new records since last poll) minimizes data transfer
- Exponential backoff prevents hammering server on repeated failures
- Alert creation is non-blocking — Twilio/webhook responses return immediately
- No impact on existing dashboard features (separate polling)

## Testing

1. **Create test alert manually**
   ```javascript
   await base44.entities.Alert.create({
     type: "booking",
     message: "Test booking alert",
     phone_number: "555-1234",
     intent: "booking",
     priority: "high"
   });
   ```

2. **Open Mission Control** → Alerts tab should show it within 3-5 seconds

3. **Test notifications** → Email should arrive within 30 seconds

4. **Test failures** → Disconnect network → AlertsPanel shows "OFFLINE" → Reconnect → "LIVE"

## Next Steps (Optional)

- Add WebSocket real-time instead of polling (faster, more efficient)
- Add alert grouping (multiple leads from same number)
- Add alert templates (pre-built message formats)
- Add automatic escalation (SMS if unread for 5+ minutes)
- Add alert history export (CSV download)