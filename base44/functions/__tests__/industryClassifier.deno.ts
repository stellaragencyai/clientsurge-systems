import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyLeadIndustry } from "../_shared/industryClassifierCanonical.ts";

function classify(lead) {
  return classifyLeadIndustry({
    business_name: "",
    business_type: "",
    industry: null,
    industry_tags: [],
    website: "",
    source: "website",
    ...lead,
  });
}

Deno.test("nails-spa identity overrides corrupted med-spa import labels", () => {
  const result = classify({
    business_name: "Mi Mi Nails Spa",
    business_type: "Med Spa / Aesthetics",
    industry: "Med Spa / Aesthetics",
    industry_tags: ["Med Spa / Aesthetics"],
    website: "https://miminails.favesalon.com/",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "beauty");
  assertEquals(result.industry_label, "Beauty & Personal Care");
});

Deno.test("nails-and-spa identity is beauty rather than medical aesthetics", () => {
  const result = classify({
    business_name: "Ombré Nails & Spa Mesa",
    business_type: "Med Spa / Aesthetics",
    industry: "Med Spa / Aesthetics",
    industry_tags: ["Med Spa / Aesthetics"],
    website: "https://powernailspa.com",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "beauty");
});

Deno.test("explicit medspa identity overrides generic beauty import", () => {
  const result = classify({
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

Deno.test("physical therapy is not categorized as generic fitness", () => {
  const result = classify({
    business_name: "360 Physical Therapy",
    business_type: "Fitness / Wellness",
    industry: "Fitness / Wellness",
    industry_tags: ["Fitness / Wellness"],
    website: "https://www.360physicaltherapy.com/locations/signal-butte",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "physical_therapy");
  assertEquals(result.industry_label, "Physical Therapy & Rehabilitation");
});

Deno.test("dental identity outranks the word aesthetic", () => {
  const result = classify({
    business_name: "Aesthetic Family Dental Care",
    business_type: "Dental",
    industry: "Dental",
    website: "https://www.myazsmile.com/",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "dental");
});

Deno.test("generic identity with a contradictory website requires review", () => {
  const result = classify({
    business_name: "Doe",
    business_type: "Dental",
    website: "www.cryptoacademymastery.com",
  });

  assertEquals(result.status, "review_required");
  assertEquals(result.conflict, true);
});

Deno.test("explicit HVAC name with plumbing website requires review", () => {
  const result = classify({
    business_name: "HVAC",
    business_type: "Home & Local Services",
    industry: "Home & Local Services",
    industry_tags: ["Home & Local Services"],
    website: "paloaltoplumbing.net",
  });

  assertEquals(result.status, "review_required");
  assertEquals(result.industry_key, "hvac");
  assertEquals(result.conflict, true);
});

Deno.test("clear HVAC identity remains HVAC", () => {
  const result = classify({
    business_name: "Apex HVAC Services",
    business_type: "HVAC",
    industry_tags: ["heating and air conditioning", "indoor air quality"],
    website: "https://www.apexheatingandair.com/",
  });

  assertEquals(result.status, "classified");
  assertEquals(result.industry_key, "hvac");
  assertEquals(result.industry_label, "HVAC");
});

Deno.test("internal smoke-test leads are excluded", () => {
  const result = classify({
    business_name: "ClientSurge CRM Smoke roofing 20260605200643",
    business_type: "roofing",
    source: "crm_live_smoke_test",
    website: "https://crm-smoke-roofing.example.com",
  });

  assertEquals(result.status, "excluded_test");
  assertEquals(result.industry_key, "internal_test");
});
