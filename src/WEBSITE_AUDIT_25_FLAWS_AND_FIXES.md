# ClientSurge Website: 25 Flaws & Fixes Audit
**Date:** 2026-04-28 | **Severity:** Mixed (Critical, High, Medium)

---

## CRITICAL FLAWS (1-10)

### 1. **Race Condition in Lead Deduplication**
**Flaw:** `submitLeadCapture` checks for duplicates, but two simultaneous submissions can create duplicate leads.
**Fix:** Add database-level unique constraint on `email + business_name` and handle conflict gracefully.
```javascript
// In submitLeadCapture: wrap in try-catch for integrity error
try {
  const createdLead = await base44.asServiceRole.entities.WebsiteLead.create({...});
} catch (error) {
  if (error.code === 'UNIQUE_CONSTRAINT') {
    const existing = await base44.asServiceRole.entities.WebsiteLead.filter({
      email: lead.email,
      business_name: lead.business_name
    }, '-created_date', 1);
    return Response.json({ success: true, lead_id: existing[0].id, action: 'duplicate' });
  }
}
```

---

### 2. **Missing Phone Number Normalization in Lead Matching**
**Flaw:** Phone number formats vary (10 digits, 11 digits, +1, spaces), causing SMS replies to not match leads.
**Fix:** Normalize ALL phone numbers to E.164 format consistently.
```javascript
// Create a utility function
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits.slice(-10);
}

// Use in receiveTwilioInboundSms, sendWebsiteLeadResponse, etc.
```

---

### 3. **Unhandled Twilio API Rate Limits**
**Flaw:** Functions don't retry on 429 (rate limit) errors, causing SMS sends to fail silently.
**Fix:** Implement exponential backoff retry logic.
```javascript
async function sendSMSWithRetry(to, from, body, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('...', { /* ... */ });
      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

---

### 4. **Email Templates Not Escaping User Input**
**Flaw:** Lead names in email templates can contain HTML/script injection.
**Fix:** Sanitize all user input before template rendering.
```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// In sendEmail:
const body = template.replace(/{first_name}/g, escapeHtml(lead.first_name || 'there'));
```

---

### 5. **Missing Transaction Idempotency in Payment Webhook**
**Flaw:** `stripeWebhookOrders` can process the same webhook twice, creating duplicate orders.
**Fix:** Check for existing webhook processing before updating.
```javascript
// In stripeWebhookOrders:
const existingEvent = await base44.asServiceRole.entities.CommunicationEvent.filter({
  provider_message_id: event.id,
  event_type: 'order_paid'
}, '-created_date', 1);

if (existingEvent?.length > 0) {
  return Response.json({ received: true, processed: false });
}
```

---

### 6. **Cadence Processor Not Checking for Blocked Leads**
**Flaw:** `processDynamicFollowUps` sends messages to leads that are booked/closed but query doesn't filter them properly.
**Fix:** Add explicit status checks in query.
```javascript
const leads = await base44.asServiceRole.entities.WebsiteLead.filter({
  lead_status: { $in: ["new", "contacted"] },
  reply_status: "none",
  booking_status: "none", // Explicit non-booked
  automation_enabled: true,
  cadence_paused: { $ne: true },
  initial_response_sent_at: { $exists: true }
}, "-initial_response_sent_at", 500);
```

---

### 7. **Insufficient Permissions Check in Admin Functions**
**Flaw:** Some admin functions check `user.role === 'admin'` but don't verify user exists first.
**Fix:** Add null check before role check.
```javascript
const user = await base44.auth.me().catch(() => null);
if (!user || user.role !== 'admin') {
  return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
}
```

---

### 8. **Missing Error Handling in Async Operations**
**Flaw:** `CommunicationLogsPanel` fetches logs without error state, causing UI to hang.
**Fix:** Add try-catch and error state.
```javascript
const [error, setError] = useState(null);

const loadLogs = async () => {
  try {
    setError(null);
    const data = await base44.asServiceRole.entities.CommunicationEvent.filter({...});
    setLogs(data || []);
  } catch (err) {
    setError('Failed to load logs: ' + err.message);
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

---

### 9. **Webhook Signature Validation Using String Comparison**
**Flaw:** `receiveTwilioInboundSms` compares signatures with `!==` which can be timing-attack vulnerable.
**Fix:** Use constant-time comparison.
```javascript
// Before:
if (computed !== signature) return Response.json({...}, {status: 403});

// After:
const crypto = await import('crypto');
const isValid = crypto.timingSafeEqual(
  Buffer.from(computed), 
  Buffer.from(signature)
).catch(() => false);
if (!isValid) return Response.json({...}, {status: 403});
```

---

### 10. **Missing CORS Headers on Public Endpoints**
**Flaw:** Public webhook endpoints don't declare CORS headers, causing preflight failures in some environments.
**Fix:** Add CORS headers to response.
```javascript
return Response.json(data, {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
});
```

---

## HIGH SEVERITY FLAWS (11-18)

### 11. **Follow-Up Steps Not Resetting on Lead Status Change**
**Flaw:** If lead status changes from "contacted" back to "new", follow_up_step isn't reset, causing timing issues.
**Fix:** Reset follow-up metadata on status change.
```javascript
// In updateLeadStatus or when changing lead_status:
const updateData = { lead_status: newStatus };
if (newStatus === 'new' || newStatus === 'ignored') {
  updateData.follow_up_step = 0;
  updateData.next_follow_up_at = null;
  updateData.initial_response_sent_at = null;
}
await base44.asServiceRole.entities.WebsiteLead.update(leadId, updateData);
```

---

### 12. **Missing Engagement Score Validation**
**Flaw:** `engagement_score` can be set to values > 100 or < 0, breaking logic.
**Fix:** Clamp values in all functions that set it.
```javascript
const engagementScore = Math.max(0, Math.min(100, calculateEngagementScore(lead)));
```

---

### 13. **Settings Not Loaded Before Using in Automations**
**Flaw:** Functions assume AdminSettings exist, but if none created, they crash.
**Fix:** Use getDefaultSettings as fallback.
```javascript
const settingsRecords = await base44.asServiceRole.entities.AdminSettings.list('-created_date', 1).catch(() => []);
const settings = settingsRecords?.[0] || {
  cadence_default_mode: 'auto',
  cadence_switch_attempts: 3,
  cadence_pause_on_reply: true,
  cadence_engagement_threshold: 50,
  cadence_max_attempts: 6,
  twilio_phone_number: Deno.env.get('TWILIO_PHONE_NUMBER'),
};
```

---

### 14. **No Validation for Phone Number Before Sending SMS**
**Flaw:** `processDynamicFollowUps` sends SMS even if phone_number is empty/invalid.
**Fix:** Validate before send.
```javascript
if (!lead.phone_number || lead.phone_number.length < 10) {
  // Skip and log as failed
  await logSkipped(lead.id, 'sms', 'Invalid phone number');
  continue;
}
```

---

### 15. **CommunicationEvent Metadata Not Parsed in Logs Panel**
**Flaw:** `metadata_json` is stored as string but not parsed when displaying, showing "[object Object]".
**Fix:** Parse JSON in component or use parseMetadata helper.
```javascript
const parseMetadata = (json) => {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
};

// In CommunicationLogsPanel:
const metadata = parseMetadata(log.metadata_json);
```

---

### 16. **Lead Engagement Not Updated on Email Open/Click**
**Flaw:** Only replies trigger engagement score, but email opens/clicks don't (if tracking enabled).
**Fix:** Create webhook for Resend email events.
```javascript
// New function: receiveResendWebhook
// Handle events: email.opened, email.clicked
// Update engagement_score accordingly
const engagementBoost = event.type === 'email.opened' ? 15 : event.type === 'email.clicked' ? 25 : 0;
```

---

### 17. **Timezone Issues in Scheduled Follow-Ups**
**Flaw:** `next_follow_up_at` is stored in UTC but cadence logic doesn't account for user timezone.
**Fix:** Store timezone on AdminSettings and convert when calculating delays.
```javascript
const userTz = settings.timezone || 'America/Phoenix'; // Default
const now = new Date();
const nextTime = new Date(now.getTime() + (delay * 60 * 1000)); // Already in UTC, correct
// No conversion needed if always storing UTC, but document this clearly
```

---

### 18. **Missing Bulk Action Confirmation Modal**
**Flaw:** Users can accidentally delete/pause all leads without confirmation.
**Fix:** Add confirmation before bulk operations in LeadManagementDashboard.
```javascript
const handleBulkAction = async (action, leadIds) => {
  if (!window.confirm(`Are you sure you want to ${action} ${leadIds.length} leads?`)) {
    return;
  }
  // Proceed with action
};
```

---

## MEDIUM SEVERITY FLAWS (19-25)

### 19. **Engagement Score Calculation Not Consistent**
**Flaw:** `calculateEngagementScore` in `processDynamicFollowUps` is different from other functions.
**Fix:** Create a single shared utility.
```javascript
// Create utils/engagementScore.js
export function calculateEngagementScore(lead) {
  let score = 0;
  if (lead.reply_status === 'responded') score += 40;
  if (lead.booking_status === 'clicked') score += 30;
  if (lead.booking_status === 'booked') score += 30;
  return Math.min(score, 100);
}

// Import in all functions
import { calculateEngagementScore } from '@/utils/engagementScore';
```

---

### 20. **Missing Loading States in Admin UI**
**Flaw:** `DynamicCadencePanel` shows "Loading..." but doesn't show loading state for individual fields while saving.
**Fix:** Add per-field loading indicator.
```javascript
<input
  disabled={saving}
  className={saving ? 'opacity-50 cursor-not-allowed' : ''}
  {...}
/>
```

---

### 21. **No Validation for Custom Cadence Settings Range**
**Flaw:** User can set `cadence_max_attempts: 100` which is unrealistic.
**Fix:** Add min/max validation in component.
```javascript
<input
  type="number"
  min="2"
  max="20"
  value={settings?.cadence_max_attempts || 6}
  {...}
/>
```

---

### 22. **WebsiteLead Fields Not Defaulting Properly**
**Flaw:** `follow_up_step` and `sms_attempt_count` can be undefined, breaking math.
**Fix:** Use nullish coalescing in all calculations.
```javascript
const totalAttempts = (lead.sms_attempt_count ?? 0) + (lead.email_attempt_count ?? 0);
const currentStep = lead.follow_up_step ?? 0;
```

---

### 23. **Missing Audit Log for Configuration Changes**
**Flaw:** When admin changes cadence settings, no record of who changed what/when.
**Fix:** Log changes to CommunicationEvent.
```javascript
// In DynamicCadencePanel handleSave:
await base44.asServiceRole.entities.CommunicationEvent.create({
  context_type: 'admin_settings',
  channel: 'internal',
  direction: 'system',
  event_type: 'settings_changed',
  provider: 'internal',
  status: 'processed',
  subject: 'Cadence settings updated',
  metadata_json: JSON.stringify({
    changed_fields: Object.keys(changes),
    old_values: previousSettings,
    new_values: settings,
    changed_by: user.email,
  }),
});
```

---

### 24. **No Retry Logic for Failed Email Sends**
**Flaw:** If Resend API fails, email is marked as failed and never retried.
**Fix:** Create retry mechanism using AutomationJob.
```javascript
// If email send fails:
const automationJob = await base44.asServiceRole.entities.AutomationJob.create({
  lead_id: lead.id,
  job_type: 'confirmation_email',
  trigger_event: 'lead_created',
  status: 'queued',
  scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Retry in 5 min
  last_error: error.message,
  attempts: 0,
});
```

---

### 25. **Footer Component Not Responsive on Mobile**
**Flaw:** Footer has 5-column grid that wraps poorly on mobile, text overlaps.
**Fix:** Update grid to stack on mobile.
```jsx
// In Footer component:
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
  {/* items */}
</div>

// Or:
<div className="grid grid-cols-5 gap-6 md:grid-cols-1">
  {/* Will need to adjust order */}
</div>
```

---

## Summary Table

| # | Flaw | Severity | Type | Impact |
|---|------|----------|------|--------|
| 1 | Race condition in deduplication | Critical | Data | Data corruption |
| 2 | Phone number normalization | Critical | Logic | SMS not matching |
| 3 | Twilio rate limits unhandled | Critical | API | SMS fails silently |
| 4 | Email template injection | Critical | Security | XSS vulnerability |
| 5 | Payment webhook idempotency | Critical | Data | Duplicate orders |
| 6 | Cadence processor missing checks | Critical | Logic | Over-contacting |
| 7 | Missing permission checks | High | Security | Unauthorized access |
| 8 | No error handling async ops | High | UX | UI hangs |
| 9 | Timing attack in signature | High | Security | Timing vulnerability |
| 10 | Missing CORS headers | High | API | Preflight failures |
| 11 | Follow-up steps not reset | High | Logic | Timing issues |
| 12 | Engagement score validation | High | Logic | Logic breaks |
| 13 | Settings not loaded | High | Stability | Runtime crash |
| 14 | No phone validation | High | Data | Failed SMS |
| 15 | Metadata not parsed | Medium | UX | Display issues |
| 16 | Email events not tracked | Medium | Feature | Incomplete data |
| 17 | Timezone issues | Medium | Logic | Timing errors |
| 18 | No bulk confirmation | Medium | UX | Accidental deletion |
| 19 | Engagement calculation inconsistent | Medium | Code Quality | Maintenance issue |
| 20 | Missing loading states | Medium | UX | Visual feedback |
| 21 | No settings range validation | Medium | UX | Bad data |
| 22 | Fields not defaulting | Medium | Logic | Undefined errors |
| 23 | Missing audit log | Medium | Compliance | No accountability |
| 24 | No email retry logic | Medium | Reliability | Lost emails |
| 25 | Footer not responsive | Medium | UX | Mobile broken |

---

## Implementation Priority

**Week 1 (Critical):** Flaws 1, 2, 3, 4, 5, 6
**Week 2 (High):** Flaws 7, 8, 9, 10, 11, 12, 13, 14
**Week 3 (Medium):** Flaws 15-25