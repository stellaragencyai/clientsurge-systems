import { buildLegacyEndpointResponse } from "../_shared/legacyQuarantine.js";

Deno.serve(() => buildLegacyEndpointResponse("autoProvisionTwilioNumber"));
