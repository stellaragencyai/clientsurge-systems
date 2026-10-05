import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_SHELL_PUBLIC_PATHS,
  BLOG_SITEMAP_PATHS,
  PUBLIC_DIRECTORY_PAGES,
  PUBLIC_ROUTE_METADATA,
  SITEMAP_STATIC_PATHS,
} from '../src/lib/publicRouteMetadata.js';

const EXPECTED_PUBLIC_PAGES = [
  '/',
  '/pricing',
  '/automations',
  '/contact',
  '/industries',
  '/proof',
  '/faq',
  '/how-it-works',
  '/about',
  '/blog',
  '/testimonials',
  '/roadmap',
  '/privacy',
  '/terms',
  '/sms-terms',
  '/refund-policy',
];

const GENERIC_APP_DIRECTORY_PHRASES = [
  'manages 5 data types',
  'data types and pages',
  'base44',
  'mission control',
  'saas admin',
];

test('public directory stays limited to customer-facing pages', () => {
  assert.deepEqual(PUBLIC_DIRECTORY_PAGES, EXPECTED_PUBLIC_PAGES);
  assert.deepEqual(SITEMAP_STATIC_PATHS, EXPECTED_PUBLIC_PAGES);
  assert.deepEqual(BLOG_SITEMAP_PATHS, []);
  for (const route of EXPECTED_PUBLIC_PAGES) {
    assert.ok(APP_SHELL_PUBLIC_PATHS.includes(route), `${route} should render in the public app shell`);
  }
  for (const route of ['/login', '/product-signup', '/store', '/book']) {
    assert.equal(PUBLIC_DIRECTORY_PAGES.includes(route), false, `${route} should stay out of public directory output`);
    assert.ok(APP_SHELL_PUBLIC_PATHS.includes(route), `${route} should remain reachable in the app shell`);
  }
});

test('public metadata does not use generic app-directory wording', () => {
  for (const [path, meta] of Object.entries(PUBLIC_ROUTE_METADATA)) {
    const text = `${meta.title || ''} ${meta.description || ''}`.toLowerCase();
    for (const phrase of GENERIC_APP_DIRECTORY_PHRASES) {
      assert.equal(text.includes(phrase), false, `${path} metadata should not contain ${phrase}`);
    }
  }
});
