// Task #44: Enforce external link security policy
export function isExternalLink(href) {
  if (!href) return false;
  return href.startsWith("http://") || href.startsWith("https://");
}

export function getSecureExternalLinkProps(href) {
  return {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

// Automatically wrap external links with security attributes
export function enforceExternalLinkSecurity(element) {
  if (!element) return;
  const links = element.querySelectorAll('a[href]');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (isExternalLink(href)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}