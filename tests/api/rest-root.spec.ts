// ---------------------------------------------------------------------------
// REST API "root" tests (no login needed)
// ---------------------------------------------------------------------------
// Every WordPress site has a public "front door" for its API at /wp-json/.
// Visiting it returns a summary of the site and a list of available features
// ("namespaces"). These tests just confirm that front door works.
// ---------------------------------------------------------------------------

// `test` defines a test, `expect` makes checks/assertions.
import { test, expect } from '@playwright/test';

// Group these related tests under one heading.
test.describe('WP REST API root', () => {
  // -------------------------------------------------------------------------
  // Test 1: The API root should load and advertise the features we rely on.
  // -------------------------------------------------------------------------
  test('exposes the API root with a name and namespaces', async ({ request }) => {
    // Ask for the API front door. `request` already knows the site's base URL.
    const res = await request.get('/wp-json/');

    // res.ok() is true for a successful (200-level) response.
    expect(res.ok()).toBeTruthy();

    // Convert the JSON text into an object we can read.
    const body = await res.json();

    // The site should tell us its name (e.g. "Quality Ladles").
    expect(body).toHaveProperty('name');

    // "namespaces" is the list of API sections that are turned on.
    // We confirm it is actually a list (array).
    expect(Array.isArray(body.namespaces)).toBeTruthy();

    // We depend on core WordPress ("wp/v2") and WooCommerce ("wc/v3").
    // These checks fail loudly if either is ever disabled.
    expect(body.namespaces).toContain('wp/v2');
    expect(body.namespaces).toContain('wc/v3');
  });

  // -------------------------------------------------------------------------
  // Test 2: The API should identify its responses as JSON.
  // (JSON is the data format APIs use. This guards against a broken server
  //  accidentally returning an HTML error page instead.)
  // -------------------------------------------------------------------------
  test('responds with JSON content type', async ({ request }) => {
    const res = await request.get('/wp-json/');

    // Every response has "headers" (metadata). The "content-type" header
    // tells us what kind of data the body is. We expect it to mention JSON.
    expect(res.headers()['content-type']).toContain('application/json');
  });
});
