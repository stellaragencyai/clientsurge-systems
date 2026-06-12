// TODO: Host OG image on a permanent CDN (e.g. clientsurgesystems.com/og-image.png) to avoid dependency on Base44 CDN
// #341: OG image hosted on clientsurgesystems.com — no Base44 CDN dependency
const DEFAULT_OG_IMAGE = "https://clientsurgesystems.com/og-image.png";

function prettifySegment(segment) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function stripSiteSuffix(title = "") {
  return title.replace(/\s*\|\s*ClientSurge Systems\s*$/i, "").trim();
}

export function buildBreadcrumbSchema({ canonicalPath = "/", title = "" }) {
  const normalizedPath = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://clientsurgesystems.com/",
    },
  ];

  let runningPath = "";
  segments.forEach((segment, index) => {
    runningPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const fallbackName = prettifySegment(segment);
    const name = isLast ? stripSiteSuffix(title) || fallbackName : fallbackName;

    items.push({
      "@type": "ListItem",
      position: index + 2,
      name,
      item: `https://clientsurgesystems.com${runningPath}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function getHead() {
  return (typeof document !== "undefined" && document.head) ? document.head : null;
}

function ensureMeta(attribute, key) {
  const head = getHead();
  if (!head) return { setAttribute: () => {} };

  const selector =
    attribute === "name"
      ? `meta[name="${key}"]`
      : `meta[property="${key}"]`;

  let element = head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    head.appendChild(element);
  }
  return element;
}

function ensureCanonical() {
  const head = getHead();
  if (!head) return { setAttribute: () => {} };

  let element = head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    head.appendChild(element);
  }
  return element;
}

function ensureJsonLd(id) {
  const head = getHead();
  if (!head) return { textContent: "", remove: () => {} };

  let element = head.querySelector(`script[data-schema-id="${id}"]`);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.dataset.schemaId = id;
    head.appendChild(element);
  }
  return element;
}

export function setPageMetadata({
  title,
  description,
  canonicalPath = "/",
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  robots = "index,follow",
}) {
  const head = getHead();
  if (!head) return () => {};

  const previous = {
    title: document.title,
    description: head.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    robots: head.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
    canonical: head.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    ogTitle: head.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
    ogDescription:
      head.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
    ogUrl: head.querySelector('meta[property="og:url"]')?.getAttribute("content") || "",
    ogImage: head.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
    twitterTitle:
      head.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || "",
    twitterDescription:
      head.querySelector('meta[name="twitter:description"]')?.getAttribute("content") || "",
    twitterImage:
      head.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || "",
  };

  const canonicalUrl = `https://clientsurgesystems.com${canonicalPath}`;
  const breadcrumbSchema = buildBreadcrumbSchema({ canonicalPath, title });

  document.title = title;
  ensureMeta("name", "description").setAttribute("content", description);
  ensureMeta("name", "robots").setAttribute("content", robots);
  ensureCanonical().setAttribute("href", canonicalUrl);

  ensureMeta("property", "og:title").setAttribute("content", ogTitle || title);
  ensureMeta("property", "og:description").setAttribute("content", ogDescription || description);
  ensureMeta("property", "og:type").setAttribute("content", "website");
  ensureMeta("property", "og:url").setAttribute("content", canonicalUrl);
  ensureMeta("property", "og:image").setAttribute("content", ogImage);
  ensureMeta("property", "og:image:width").setAttribute("content", "1200");
  ensureMeta("property", "og:image:height").setAttribute("content", "630");

  ensureMeta("name", "twitter:card").setAttribute("content", "summary_large_image");
  ensureMeta("name", "twitter:url").setAttribute("content", canonicalUrl);
  ensureMeta("name", "twitter:title").setAttribute("content", ogTitle || title);
  ensureMeta("name", "twitter:description").setAttribute("content", ogDescription || description);
  ensureMeta("name", "twitter:image").setAttribute("content", ogImage);

  const cleanupBreadcrumb = breadcrumbSchema
    ? setJsonLd(`breadcrumb-${canonicalPath.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}`, breadcrumbSchema)
    : null;

  return () => {
    cleanupBreadcrumb?.();
    document.title = previous.title;
    ensureMeta("name", "description").setAttribute("content", previous.description);
    ensureMeta("name", "robots").setAttribute("content", previous.robots || "index,follow");
    ensureCanonical().setAttribute("href", previous.canonical || "https://clientsurgesystems.com/");
    ensureMeta("property", "og:title").setAttribute("content", previous.ogTitle);
    ensureMeta("property", "og:description").setAttribute("content", previous.ogDescription);
    ensureMeta("property", "og:url").setAttribute("content", previous.ogUrl);
    ensureMeta("property", "og:image").setAttribute("content", previous.ogImage);
    ensureMeta("name", "twitter:title").setAttribute("content", previous.twitterTitle);
    ensureMeta("name", "twitter:description").setAttribute("content", previous.twitterDescription);
    ensureMeta("name", "twitter:image").setAttribute("content", previous.twitterImage);
    ensureMeta("name", "twitter:url").setAttribute("content", previous.ogUrl);
  };
}

export function setJsonLd(id, data) {
  const element = ensureJsonLd(id);
  element.textContent = JSON.stringify(data);
  return () => {
    element.remove();
  };
}