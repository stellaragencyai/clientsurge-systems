/**
 * CUSTOMER-CANONICAL
 * Paid-customer lead ingestion must enter only through the canonical
 * Leads + CommunicationEvent path in _shared/customerLeadIngestion.js.
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  CustomerLeadIngestionError,
  ingestCustomerLead,
} from "../_shared/customerLeadIngestion.js";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const result = await ingestCustomerLead({
      base44,
      payload,
      headers: req.headers,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ingest customer lead";
    const status = error instanceof CustomerLeadIngestionError ? error.status : 500;
    const code = error instanceof CustomerLeadIngestionError ? error.code : "customer_lead_ingestion_failed";
    const details = error instanceof CustomerLeadIngestionError ? error.details : undefined;

    return Response.json(
      {
        success: false,
        error: message,
        code,
        details,
      },
      { status }
    );
  }
});
