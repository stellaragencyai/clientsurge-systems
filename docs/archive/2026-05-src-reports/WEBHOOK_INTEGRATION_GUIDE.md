# Webhook Integration Guide

## Overview

Two production-ready webhook endpoints now receive and process:
1. **Lead Capture** (`/webhooks/lead-capture`) - Forms, API integrations, lead data
2. **Twilio Calls** (`/webhooks/twilio-calls`) - Incoming calls, missed calls, voicemails

Both webhooks automatically trigger service configurations and log all events.

---

## Webhook 1: Lead Capture

**Endpoint:** `POST /webhooks/lead-capture`

**Purpose:** Ingest leads from web forms, CRM integrations, API calls, and marketing platforms.

### Supported Input Formats

The webhook is flexible and accepts multiple field naming conventions:

```json
{
  "full_name": "John Doe",          // or: name, contact_name
  "email": "john@acme.com",          // or: contact_email
  "phone": "+16025874608",           // or: contact_phone
  "business_name": "Acme Corp",      // or: company
  "business_type": "Medical Spa",    // or: industry
  "problem": "Need lead capture",    // or: message, inquiry
  "source": "google_form",           // or: utm_source
  "project_id": "proj_xxx"           // Optional: direct project link
}
```

### Request Flow

1. **Parse & Validate** - Extract lead data, require email OR phone
2. **Find Project** - Match to ClientProject by:
   - `project_id` (direct)
   - Webhook registration (service config)
   - First active project (fallback)
3. **Create Lead** - Insert into `Leads` entity
4. **Trigger Instant Response** - If `instant_lead_response` enabled:
   - Queue SMS with template
   - Log communication event
5. **Assign & Log** - Update lead status and assignment

### Response

**Success (200):**
```json
{
  "success": true,
  "lead_id": "lead_xxx",
  "message": "Lead captured and instant response triggered"
}
```

**Error (400/500):**
```json
{
  "success": false,
  "error": "Email or phone required"
}
```

### Example: Web Form Integration

```html
<form id="contact-form">
  <input type="text" name="full_name" required />
  <input type="email" name="email" required />
  <input type="tel" name="phone" />
  <input type="text" name="business_name" />
  <textarea name="problem"></textarea>
  <button type="submit">Submit</button>
</form>

<script>
  document.getElementById("contact-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    
    // Add tracking
    payload.source = "website_form";
    payload.project_id = "proj_xxx"; // Set your project ID
    
    const response = await fetch("/webhooks/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    if (result.success) {
      alert("Thank you! We'll be in touch shortly.");
      e.target.reset();
    } else {
      alert(`Error: ${result.error}`);
    }
  });
</script>
```

### Example: Zapier Integration

**Trigger:** Any event (Google Forms, TypeForm, etc.)
**Action:** Send to Webhook

```
URL: https://your-app.com/webhooks/lead-capture
Method: POST
Content-Type: application/json

Payload:
{
  "full_name": "{{First Name}} {{Last Name}}",
  "email": "{{Email}}",
  "phone": "{{Phone}}",
  "business_name": "{{Company}}",
  "problem": "{{Message}}",
  "source": "zapier",
  "project_id": "proj_xxx"
}
```

### Example: Direct API Call

```bash
curl -X POST https://your-app.com/webhooks/lead-capture \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sarah Johnson",
    "email": "sarah@medspa.com",
    "phone": "+16025874608",
    "business_name": "Glow Med Spa",
    "problem": "Need appointment booking system",
    "source": "inbound_call",
    "project_id": "proj_abc123"
  }'
```

---

## Webhook 2: Twilio Calls

**Endpoint:** `POST /webhooks/twilio-calls`

**Purpose:** Handle inbound calls, missed calls, voicemails, and call recordings.

### Twilio Configuration

1. **In Twilio Console:**
   - Go to your phone number settings
   - Set **Voice** configuration:
     - **Webhook URL:** `https://your-app.com/webhooks/twilio-calls`
     - **HTTP Method:** POST
   - Set **Messaging** configuration (SMS):
     - **Webhook URL:** `https://your-app.com/webhooks/twilio-calls`
     - **HTTP Method:** POST

2. **In ClientProject Config:**
   ```json
   {
     "install_configuration": {
       "services": {
         "missed_call_text_back": {
           "enabled": true,
           "twilio_number": "+16025874608",
           "sms_template_id": "template_xxx",
           "webhook_url": "https://your-app.com/webhooks/twilio-calls"
         }
       }
     }
   }
   ```

### Twilio Payload (Form-Encoded)

The webhook receives Twilio's standard form data:

```
CallSid=CA1234567890abcdef1234567890abcdef&
From=%2B16025874608&
To=%2B16025874608&
CallStatus=no-answer&
CallDuration=0&
RecordingUrl=https://api.twilio.com/2010-04-01/Accounts/.../Recordings/RE...&
Timestamp=2026-04-28T10%3A32%3A15Z
```

### Call Status Values

| Status | Meaning | Triggers SMS |
|--------|---------|--------------|
| `completed` | Call answered | No |
| `no-answer` | Unanswered/voicemail | Yes ✓ |
| `failed` | Failed to connect | Yes ✓ |
| `busy` | Line busy | Yes ✓ |
| `ringing` | Ringing | No |
| `in-progress` | Call active | No |

### Request Flow

1. **Parse Form Data** - Extract Twilio call metadata
2. **Find Project** - Match by Twilio phone number in config
3. **Find/Create Lead** - Search by caller's phone number
4. **Log Event** - Record call in CommunicationEvent
5. **Handle Missed Call** - If status is `no-answer` or `failed`:
   - Get SMS template from config
   - Queue SMS recovery message
   - Update lead status to "Contacted"
6. **Log Recording** - If RecordingUrl provided, store reference

### Response

Always return `200 OK` to acknowledge receipt:

```
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 2

OK
```

### Example: Missed Call Flow

```
1. Customer calls +16025874608
   ↓
2. No one available → Goes to voicemail
   ↓
3. Twilio sends webhook to /webhooks/twilio-calls
   ↓
4. Lead found/created from caller's phone
   ↓
5. Status = "no-answer"
   ↓
6. SMS template retrieved: "Hi {{name}}, we missed your call..."
   ↓
7. SMS queued to {{phone}}
   ↓
8. Lead status updated to "Contacted"
   ↓
9. Admin sees lead in priority queue
```

### SMS Template Example

```
Hi {{name}}, we missed your call! We're available {{days}}.

Schedule now: {{booking_link}}
```

---

## Event Logging

Both webhooks create entries in `CommunicationEvent` for auditing:

### Lead Capture Events

```json
{
  "lead_id": "lead_xxx",
  "client_project_id": "proj_xxx",
  "service_key": "instant_lead_response",
  "channel": "form",
  "direction": "inbound",
  "event_type": "lead_created",
  "provider": "internal",
  "status": "received",
  "message_body": "Customer inquiry about services",
  "metadata_json": "{ original webhook payload }"
}
```

### Twilio Call Events

```json
{
  "lead_id": "lead_xxx",
  "client_project_id": "proj_xxx",
  "service_key": "missed_call_text_back",
  "channel": "call",
  "direction": "inbound",
  "event_type": "call_missed",
  "provider": "twilio",
  "status": "no-answer",
  "subject": "Inbound call from +16025874608",
  "message_body": "Call status: no-answer, Duration: 0s",
  "provider_message_id": "CA1234567890abcdef..."
}
```

---

## Automation Jobs Created

### Lead Capture
- **Type:** `instant_sms`
- **Trigger:** `lead_created`
- **Status:** `queued`
- **Action:** Send SMS template to lead's phone

### Twilio Missed Call
- **Type:** `instant_sms`
- **Trigger:** `missed_call`
- **Status:** `queued`
- **Action:** Send recovery SMS with booking link

---

## Data Flow Diagram

```
LEAD CAPTURE WEBHOOK
┌─────────────────┐
│ Form Submission │
└────────┬────────┘
         ↓
┌─────────────────────────┐
│ /webhooks/lead-capture  │
└────────┬────────────────┘
         ↓
  Parse & Validate (email OR phone)
         ↓
  Find/Match ClientProject
         ↓
  Create Lead entity
         ↓
  Log CommunicationEvent (inbound)
         ↓
  ┌─ instant_lead_response enabled?
  │     ↓ YES
  │  Get SMS template
  │     ↓
  │  Queue AutomationJob (instant_sms)
  │     ↓
  │  Log CommunicationEvent (outbound SMS)
  └─ NO: Skip
         ↓
  Queue AutomationJob (lead_assignment)
         ↓
  Return 200 OK


TWILIO CALLS WEBHOOK
┌──────────────────┐
│ Inbound Call     │
└────────┬─────────┘
         ↓
┌──────────────────────────┐
│ /webhooks/twilio-calls   │
└────────┬─────────────────┘
         ↓
  Parse form-encoded Twilio data
         ↓
  Find ClientProject by Twilio number
         ↓
  Find/Create Lead by caller phone
         ↓
  Log CommunicationEvent (call received)
         ↓
  ┌─ Call status = no-answer/failed?
  │     ↓ YES
  │  Get SMS template (missed_call_text_back)
  │     ↓
  │  Queue AutomationJob (instant_sms)
  │     ↓
  │  Log CommunicationEvent (outbound SMS)
  │     ↓
  │  Update Lead status → "Contacted"
  └─ NO: Skip SMS
         ↓
  ┌─ Recording URL provided?
  │     ↓ YES
  │  Log CommunicationEvent (call_recording)
  └─ NO: Skip
         ↓
  Return 200 OK
```

---

## Testing Webhooks Locally

### Test Lead Capture

```bash
curl -X POST http://localhost:8000/webhooks/lead-capture \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+16025874608",
    "business_name": "Test Business",
    "problem": "Testing webhook",
    "project_id": "proj_test"
  }'
```

### Test Twilio Call

```bash
curl -X POST http://localhost:8000/webhooks/twilio-calls \
  --data-urlencode "CallSid=CA1234567890abcdef1234567890abcdef" \
  --data-urlencode "From=+16025874608" \
  --data-urlencode "To=+16025874608" \
  --data-urlencode "CallStatus=no-answer" \
  --data-urlencode "CallDuration=0"
```

---

## Production Deployment

1. **Publish App** - Deploy to production URL
2. **Configure Webhooks:**
   - Update form endpoints to point to live URL
   - Update Twilio console with live webhook URL
3. **Verify Integration:**
   - Test lead capture from form
   - Test inbound call to Twilio number
   - Check CommunicationEvent logs
4. **Monitor:**
   - Watch AutomationJob queue for SMS sends
   - Check webhook logs for errors

---

## Error Handling

Both webhooks:
- Return appropriate HTTP status codes
- Log errors to console
- Accept webhooks gracefully (don't crash)
- Create partial records when possible
- Return 200 OK to external providers to prevent retries

Example: If project not found, webhook still returns 200 OK to Twilio but skips processing.

---

## Future Enhancements

- [ ] Twilio request signature validation
- [ ] Lead duplicate detection
- [ ] Phone number validation & formatting
- [ ] Webhook retry logic with exponential backoff
- [ ] Real-time SMS sending (not just queueing)
- [ ] Voicemail transcription integration
- [ ] Lead enrichment on inbound call
- [ ] Advanced call routing logic