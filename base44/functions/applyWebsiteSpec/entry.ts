import { secureJson } from "../_shared/response.ts";
/**
 * applyWebsiteSpec — #441
 * Converts WebsiteSpec JSON into a structured, pasteable prompt for the site builder.
 * After approval (#440): auto-Telegrams Nolan with spec summary + deep link.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { spec_id, order_id } = await req.json();

    const specId = spec_id || (await base44.asServiceRole.entities.WebsiteSpec.filter({ order_id }).catch(() => []))[0]?.id;
    if (!specId) return secureJson({ error: "WebsiteSpec not found" }, { status: 404 });

    const spec = await base44.asServiceRole.entities.WebsiteSpec.get(specId).catch(() => null);
    if (!spec) return secureJson({ error: "Spec not found" }, { status: 404 });

    const pages = typeof spec.pages === "string" ? JSON.parse(spec.pages) : spec.pages;
    const brand = typeof spec.brand === "string" ? JSON.parse(spec.brand) : spec.brand;

    // #441: build structured pasteable prompt
    const lines: string[] = [
      `# Website Build Spec — ${brand?.business_name || "Client"}`,
      `## Tier: ${spec.package_key} | Industry: ${spec.industry}`,
      `## Brand Color: ${brand?.primary_color || "#00D4FF"}`,
      `## Logo: ${brand?.logo_url || "Not provided"}`,
      "",
    ];

    for (const page of (pages || [])) {
      lines.push(`### Page: ${page.name} (${page.slug})`);
      for (const section of (page.sections || [])) {
        lines.push(`  - Section: ${section.type}`);
        if (section.copy_blocks) {
          for (const [key, val] of Object.entries(section.copy_blocks)) {
            lines.push(`    ${key}: ${val}`);
          }
        }
        if (section.cta) lines.push(`    CTA: ${section.cta}`);
        if (section.automations) lines.push(`    Automations: ${section.automations.join(", ")}`);
      }
      lines.push("");
    }

    const prompt = lines.join("\n");

    // Mark spec as applied
    await base44.asServiceRole.entities.WebsiteSpec.update(specId, { status: "approved", approved_at: new Date().toISOString() }).catch(() => {});
    await base44.asServiceRole.entities.Order.update(spec.order_id || order_id, { workflow_stage: "Website Building" }).catch(() => {});

    // #440: Telegram Nolan with spec summary + deep link
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      const pageNames = (pages || []).map((p: any) => p.name).join(", ");
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "-1003533494424",
          text: `@trinity\n\n✅ <b>Website Spec Approved</b>\nClient: ${brand?.business_name}\nTier: ${spec.package_key}\nPages: ${pageNames}\nIndustry: ${spec.industry}\n\n<a href="https://app.base44.com/superagent">View in Admin →</a>`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }

    return secureJson({ success: true, spec_id: specId, prompt, page_count: pages?.length || 0 });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
