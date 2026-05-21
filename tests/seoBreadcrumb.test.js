import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBreadcrumbSchema } from '../src/lib/seo.js';

test('buildBreadcrumbSchema returns null for homepage', () => {
  assert.equal(buildBreadcrumbSchema({ canonicalPath: '/', title: 'Home' }), null);
});

test('buildBreadcrumbSchema builds nested inner-page breadcrumbs', () => {
  const schema = buildBreadcrumbSchema({
    canonicalPath: '/privacy-policy',
    title: 'Privacy Policy | ClientSurge Systems',
  });

  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.deepEqual(
    schema.itemListElement.map((item) => ({ position: item.position, name: item.name, item: item.item })),
    [
      { position: 1, name: 'Home', item: 'https://clientsurgesystems.com/' },
      { position: 2, name: 'Privacy Policy', item: 'https://clientsurgesystems.com/privacy-policy' },
    ]
  );
});
