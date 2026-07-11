import { assert, assertEquals } from "jsr:@std/assert@1";

import {
  buildIndustryDataQualityFlags,
  classifyLeadIndustry,
} from "../_shared/industryClassifier.ts";

Deno.test("physical therapy identity overrides stale fitness import labels", () => {
  const result = classifyLeadIndustry({
    business_name: "360 Physical Therapy",
    business_type: "Fitness / Wellness",
    industry: "Fitness / Wellness",
    industry_tags: ["Fitness / Wellness"],
    website: "https://www.360physicaltherapy.com/locations/signal-butte",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "physical_therapy");
  assertEquals(result.industry_label, "Physical Therapy & Rehabilitation");
  assert(result.confidence >= 90);
});

Deno.test("nail spa identity overrides incorrect medical-spa import label", () => {
  const result = classifyLeadIndustry({
    business_name: "Ombré Nails & Spa Mesa",
    business_type: "Med Spa / Aesthetics",
    industry: "Med Spa / Aesthetics",
    industry_tags: ["Med Spa / Aesthetics"],
    website: "https://powernailspa.com",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "beauty");
  assertEquals(result.industry_label, "Beauty & Personal Care");
});

Deno.test("explicit medspa identity overrides generic beauty import label", () => {
  const result = classifyLeadIndustry({
    business_name: "Lé Nour Medspa",
    business_type: "Beauty / Personal Care",
    industry: "Beauty / Personal Care",
    industry_tags: ["Beauty / Personal Care"],
    website: "https://lenourmedspa.com/",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "med_spa");
  assertEquals(result.industry_label, "Med Spa & Aesthetics");
});

Deno.test("HVAC, plumbing and electrical are not collapsed into one category", () => {
  const hvac = classifyLeadIndustry({
    business_name: "Apex HVAC Services",
    business_type: "HVAC",
    website: "https://apexheatingandair.com",
  });
  const plumbing = classifyLeadIndustry({
    business_name: "Desert Drain Plumbing",
    business_type: "HVAC / Plumbing / Home Services",
    website: "https://desertdrainplumbing.com",
  });
  const electrical = classifyLeadIndustry({
    business_name: "Valley Electrical Contractors",
    business_type: "Contractors & Trades",
    website: "https://valleyelectrical.com",
  });

  assertEquals(hvac.industry_key, "hvac");
  assertEquals(plumbing.industry_key, "plumbing");
  assertEquals(electrical.industry_key, "electrical");
});

Deno.test("generic identity with conflicting declared and website evidence requires review", () => {
  const result = classifyLeadIndustry({
    business_name: "Doe",
    business_type: "Dental",
    website: "https://www.cryptoacademymastery.com",
  });

  assertEquals(result.status, "review_required");
  assertEquals(result.conflict, true);
  assert(result.confidence <= 67);
});

Deno.test("explicit business name with a contradictory website requires review", () => {
  const result = classifyLeadIndustry({
    business_name: "Apex Dental Care",
    business_type: "Dental",
    website: "https://www.cryptoacademymastery.com",
  });

  assertEquals(result.status, "review_required");
  assertEquals(result.conflict, true);
});

Deno.test("internal QA records are excluded instead of treated as prospects", () => {
  const result = classifyLeadIndustry({
    business_name: "ClientSurge CRM Smoke roofing 20260606174525540",
    business_type: "roofing",
    source: "crm_live_smoke_test",
    website: "https://crm-smoke-roofing.example.com",
  });

  assertEquals(result.status, "excluded_test");
  assertEquals(result.industry_key, "internal_test");
  assertEquals(result.industry_label, "Internal Test / Excluded");
});

Deno.test("industry quality flags preserve unrelated flags and mark conflicts", () => {
  const flags = buildIndustryDataQualityFlags(
    ["missing_phone", "missing_industry"],
    {
      status: "review_required",
      conflict: true,
    },
  );

  assertEquals(flags.includes("missing_phone"), true);
  assertEquals(flags.includes("missing_industry"), false);
  assertEquals(flags.includes("industry_review_required"), true);
  assertEquals(flags.includes("industry_conflict"), true);
});
