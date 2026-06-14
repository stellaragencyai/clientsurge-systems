/**
 * Generates dynamic sitemap.xml based on published routes
 * Replaces static public/sitemap.xml
 * Should be scheduled to run weekly
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admins can regenerate sitemap
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const baseUrl = Deno.env.get('CLIENTSURGE_WEBSITE_URL') || 'https://clientsurge.com';

    // Define static routes
    const staticRoutes = [
      { path: '/', priority: 1.0, changefreq: 'daily' },
      { path: '/industries', priority: 0.9, changefreq: 'weekly' },
      { path: '/pricing', priority: 0.9, changefreq: 'monthly' },
      { path: '/automations', priority: 0.8, changefreq: 'weekly' },
      { path: '/store', priority: 0.8, changefreq: 'weekly' },
      { path: '/faq', priority: 0.7, changefreq: 'monthly' },
      { path: '/about', priority: 0.6, changefreq: 'monthly' },
      { path: '/contact', priority: 0.6, changefreq: 'weekly' },
      { path: '/blog', priority: 0.7, changefreq: 'daily' },
    ];

    // Dynamic industry routes
    const industryRoutes = [
      '/med-spa',
      '/dental',
      '/chiropractic',
      '/hvac',
      '/plumbing',
      '/roofing',
      '/contractors',
      '/real-estate',
      '/personal-injury',
    ].map(path => ({
      path,
      priority: 0.8,
      changefreq: 'weekly',
    }));

    // Combine routes
    const allRoutes = [...staticRoutes, ...industryRoutes];

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allRoutes.forEach(route => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Save to database for retrieval
    try {
      await base44.entities.SitemapRecord?.create({
        content: xml,
        generated_at: new Date().toISOString(),
        route_count: allRoutes.length,
      });
    } catch (_e) {
      // Silently continue if entity doesn't exist
    }

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return Response.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
});