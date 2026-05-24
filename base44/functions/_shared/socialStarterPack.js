const LEAD_GEN_PROMPTS = [
  "speed to lead",
  "missed-call recovery",
  "automated follow-up",
  "booking more consultations",
  "saving front-desk time",
];

const SOCIAL_PROOF_PROMPTS = [
  "client win",
  "before-and-after process",
  "testimonial-style story",
  "busy owner relief",
  "consistent bookings",
];

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

export function normalizeSocialStarterCaptions(rawCaptions = []) {
  const captions = Array.isArray(rawCaptions) ? rawCaptions : [];
  const normalized = captions.slice(0, 10).map((caption, index) => ({
    index: index + 1,
    category: caption.category === "social_proof" ? "social_proof" : "lead_gen",
    platform: caption.platform || "instagram",
    hook: caption.hook || caption.title || `Caption ${index + 1}`,
    body: caption.body || caption.caption || "",
    hashtags: Array.isArray(caption.hashtags) ? caption.hashtags : [],
  }));

  while (normalized.length < 10) {
    const index = normalized.length;
    const isLeadGen = index < 5;
    const angle = isLeadGen ? LEAD_GEN_PROMPTS[index] : SOCIAL_PROOF_PROMPTS[index - 5];
    normalized.push({
      index: index + 1,
      category: isLeadGen ? "lead_gen" : "social_proof",
      platform: "instagram",
      hook: isLeadGen ? `Turn ${angle} into booked work` : `Proof point: ${angle}`,
      body: isLeadGen
        ? `If leads wait, they drift. Use this post to invite prospects to reply or book while intent is still fresh.`
        : `Show a real customer moment, the problem they had, and the measurable outcome your system helped create.`,
      hashtags: ["#ClientSurge", "#AIAutomation"],
    });
  }

  return normalized;
}

export function buildSocialStarterPrompt({ businessName, industry, tone }) {
  return `Create exactly 10 ready-to-post social captions for ${businessName}, a ${industry} business.
Tone: ${tone || "professional, clear, revenue-focused"}.
Return JSON with {"captions":[...]}.
First 5 captions must be category "lead_gen"; last 5 must be category "social_proof".
Each caption needs: category, platform, hook, body, hashtags.`;
}

export function buildSocialStarterPdfBase64({ title, captions }) {
  const lines = [
    title || "Social Starter Pack",
    "",
    ...captions.flatMap((caption) => [
      `${caption.index}. ${caption.hook}`,
      `${caption.category} / ${caption.platform}`,
      caption.body,
      caption.hashtags.join(" "),
      "",
    ]),
  ].slice(0, 70);

  const textCommands = lines.map((line, index) => {
    const y = 760 - index * 10;
    return `BT /F1 8 Tf 40 ${Math.max(y, 40)} Td (${escapePdfText(line).slice(0, 120)}) Tj ET`;
  }).join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${textCommands.length} >> stream\n${textCommands}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefStart}\n%%EOF`;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(pdf, "utf8").toString("base64");
  }

  const bytes = new TextEncoder().encode(pdf);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
