/**
 * Public sitemap.xml — no auth required, served directly to search engines.
 * Regenerate via scheduled automation (weekly) or admin-only endpoint.
 */

Deno.serve(async (_req) => {
  try {
    const baseUrl = Deno.env.get('CLIENTSURGE_WEBSITE_URL') || 'https://clientsurge.com';
    const today = new Date().toISOString().split('T')[0];

    const routes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/industries', priority: '0.9', changefreq: 'weekly' },
      { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
      { path: '/automations', priority: '0.8', changefreq: 'weekly' },
      { path: '/store', priority: '0.8', changefreq: 'weekly' },
      { path: '/faq', priority: '0.7', changefreq: 'monthly' },
      { path: '/about', priority: '0.6', changefreq: 'monthly' },
      { path: '/contact', priority: '0.6', changefreq: 'weekly' },
      { path: '/blog', priority: '0.7', changefreq: 'daily' },
      { path: '/book', priority: '0.7', changefreq: 'weekly' },
      { path: '/library', priority: '0.5', changefreq: 'monthly' },
      { path: '/our-system', priority: '0.7', changefreq: 'monthly' },
      { path: '/testimonials', priority: '0.6', changefreq: 'monthly' },
      { path: '/product', priority: '0.7', changefreq: 'monthly' },
      { path: '/med-spa', priority: '0.8', changefreq: 'weekly' },
      { path: '/dental', priority: '0.8', changefreq: 'weekly' },
      { path: '/chiropractic', priority: '0.8', changefreq: 'weekly' },
      { path: '/hvac', priority: '0.8', changefreq: 'weekly' },
      { path: '/plumbing', priority: '0.8', changefreq: 'weekly' },
      { path: '/roofing', priority: '0.8', changefreq: 'weekly' },
      { path: '/contractors', priority: '0.8', changefreq: 'weekly' },
      { path: '/real-estate', priority: '0.8', changefreq: 'weekly' },
      { path: '/personal-injury', priority: '0.8', changefreq: 'weekly' },
    ];

    // FLAW #74: Filter out any admin/internal routes that might have been added by mistake
    const BLOCKED_PATTERNS = [/^\/admin/, /^\/mission-control/, /^\/dashboard/, /^\/setup/, /^\/onboarding/, /^\/client-/, /^\/saas\/admin/, /^\/_generated/, /^\/pages/, /^\/login/, /^\/register/, /^\/reset-/, /^\/forgot-/, /^\/opt-out/, /^\/legal\//, /^\/leads\/capture/, /^\/order-success/, /^\/thank-you/, /^\/success$/];
    const safeRoutes = routes.filter(r => !BLOCKED_PATTERNS.some(p => p.test(r.path)));

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // FLAW #72: Ensure consistent trailing slashes (no trailing slash except root)
    safeRoutes.forEach(({ path, priority, changefreq }) => {
      const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${normalizedPath}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
});