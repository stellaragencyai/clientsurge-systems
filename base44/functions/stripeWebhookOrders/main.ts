// Compatibility wrapper for Base44 runtimes that execute main.ts.
// Keep main.ts on the hardened entry implementation so payment success cannot
// create an Order without also passing the post-payment provisioning truth gate.

import "./entry.ts";
