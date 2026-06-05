export function parseAttributes(tagSource = "") {
  const attributes = {};
  const attrRegex = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

  for (const match of tagSource.matchAll(attrRegex)) {
    const [, rawName, , doubleQuoted, singleQuoted] = match;
    attributes[rawName.toLowerCase()] = doubleQuoted ?? singleQuoted ?? "";
  }

  return attributes;
}

export function extractTitle(html = "") {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
}

export function extractMetaContent(html = "", name, attrName = "name") {
  const targetName = String(name).toLowerCase();
  const targetAttr = String(attrName).toLowerCase();

  for (const match of html.matchAll(/<meta\b([^>]*?)>/gi)) {
    const attrs = parseAttributes(match[1]);
    if (attrs[targetAttr]?.toLowerCase() === targetName) {
      return attrs.content || "";
    }
  }

  return "";
}

export function extractLinkHref(html = "", relName) {
  const targetRel = String(relName).toLowerCase();

  for (const match of html.matchAll(/<link\b([^>]*?)>/gi)) {
    const attrs = parseAttributes(match[1]);
    if (attrs.rel?.toLowerCase() === targetRel) {
      return attrs.href || "";
    }
  }

  return "";
}
