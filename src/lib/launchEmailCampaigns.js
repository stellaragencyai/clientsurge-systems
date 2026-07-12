export const LAUNCH_EMAIL_CAMPAIGNS = [
  {
    key: "roofing",
    label: "Roofing & Restoration",
    campaign_name: "Launch — Roofing — First Touch",
    subject: "{business_name}: quick question about lead follow-up",
    body_text: `Hi {first_name},

I’m reaching out because ClientSurge builds lead-response systems for roofing companies.

The system can help organize website inquiries, send a text after missed calls, and keep follow-up from being forgotten.

Would it be useful if I prepared a brief automation audit for {business_name}?

Nolan
ClientSurge Systems`,
    landing_page_url: "https://clientsurgesystems.com/roofing",
    statuses: ["New"],
    industries: ["Roofing & Restoration"],
    tags: ["roofing_lead"],
  },
  {
    key: "hvac",
    label: "HVAC",
    campaign_name: "Launch — HVAC — First Touch",
    subject: "{business_name}: missed-call and follow-up question",
    body_text: `Hi {first_name},

ClientSurge installs lead-response systems for HVAC businesses.

The system can respond to new inquiries, text missed callers, and route interested homeowners into the company’s existing scheduling process.

Would a brief automation audit for {business_name} be useful?

Nolan
ClientSurge Systems`,
    landing_page_url: "https://clientsurgesystems.com/hvac",
    statuses: ["New"],
    industries: ["HVAC"],
    tags: ["hvac_lead"],
  },
  {
    key: "dental",
    label: "Dental & Orthodontics",
    campaign_name: "Launch — Dental — First Touch",
    subject: "{business_name}: new-patient follow-up question",
    body_text: `Hi {first_name},

ClientSurge builds lead-response systems for dental and orthodontic practices.

The system can organize new-patient inquiries, respond after missed calls, and keep follow-up moving toward the practice’s existing booking process.

Would it be helpful if I prepared a brief automation audit for {business_name}?

Nolan
ClientSurge Systems`,
    landing_page_url: "https://clientsurgesystems.com/dental",
    statuses: ["New"],
    industries: ["Dental & Orthodontics"],
    tags: ["dental_lead"],
  },
  {
    key: "med_spa",
    label: "Med Spa & Aesthetics",
    campaign_name: "Launch — Med Spa — First Touch",
    subject: "{business_name}: consultation follow-up question",
    body_text: `Hi {first_name},

ClientSurge installs lead-response systems for med spas and aesthetic clinics.

The system can organize treatment inquiries, respond after missed calls, and keep consultation follow-up from being lost between staff tasks.

Would a brief automation audit for {business_name} be useful?

Nolan
ClientSurge Systems`,
    landing_page_url: "https://clientsurgesystems.com/med-spa",
    statuses: ["New"],
    industries: ["Med Spa & Aesthetics"],
    tags: ["med_spa_lead"],
  },
  {
    key: "plumbing",
    label: "Plumbing",
    campaign_name: "Launch — Plumbing — First Touch",
    subject: "{business_name}: missed-call recovery question",
    body_text: `Hi {first_name},

ClientSurge builds lead-response systems for plumbing companies.

The system can capture service inquiries, text missed callers, and keep estimate or dispatch follow-up organized.

Would it be useful if I prepared a brief automation audit for {business_name}?

Nolan
ClientSurge Systems`,
    landing_page_url: "https://clientsurgesystems.com/plumbing",
    statuses: ["New"],
    industries: ["Plumbing"],
    tags: ["plumbing_lead"],
  },
];

export const LAUNCH_EMAIL_CAMPAIGN_BY_KEY = Object.fromEntries(
  LAUNCH_EMAIL_CAMPAIGNS.map((campaign) => [campaign.key, campaign])
);

export function plainTextToSimpleHtml(value = "") {
  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
