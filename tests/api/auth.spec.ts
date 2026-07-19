// ---------------------------------------------------------------------------
// Authenticated tests
// ---------------------------------------------------------------------------
// Some WordPress endpoints only work if you prove who you are (logging in).
// We prove it using an "Application Password" via HTTP Basic Auth.
// The credentials live in the .env file so they are never hard-coded here.
// ---------------------------------------------------------------------------

// `test` lets us define a test; `expect` lets us make assertions (checks).
import { test, expect } from '@playwright/test';

// Small helpers we wrote in tests/helpers/auth.ts:
//   - wpAuthHeader(): builds the "Authorization: Basic ..." header from .env
//   - hasWpAuth():    returns true only if the credentials exist in .env
import { wpAuthHeader, hasWpAuth } from '../helpers/auth';

// `describe` just groups related tests together under one heading in the report.
test.describe('Authenticated wp/v2', () => {
  // If someone runs the suite without credentials in .env, we don't want these
  // tests to fail with a confusing error. Instead we skip the whole group.
  // test.skip(condition, reason) => "skip when condition is true".
  test.skip(!hasWpAuth(), 'WP auth credentials not set in .env.');

  // -------------------------------------------------------------------------
  // Test 1: Ask the API "who am I?" while logged in.
  // -------------------------------------------------------------------------
  test('GET /users/me returns the current user', async ({ request }) => {
    // `request` is Playwright's HTTP client. It already knows the base URL
    // (https://test.sibi.win) from playwright.config.ts, so we only give the path.
    // We attach the login header so WordPress knows it's us.
    const res = await request.get('/wp-json/wp/v2/users/me', {
      headers: wpAuthHeader(),
    });

    // res.ok() is true for any success status (200-299).
    expect(res.ok()).toBeTruthy();

    // Turn the JSON response body into a JavaScript object we can inspect.
    const me = await res.json();

    // The response should describe a real user: it must have a numeric id > 0.
    expect(me).toHaveProperty('id');
    expect(me.id).toBeGreaterThan(0);

    // ...and a "slug" (the URL-friendly version of the user name).
    expect(me).toHaveProperty('slug');
  });

  // -------------------------------------------------------------------------
  // Test 2: The SAME endpoint should REJECT us when we don't send credentials.
  // This proves the endpoint is actually protected (a security sanity check).
  // -------------------------------------------------------------------------
  test('unauthenticated /users/me is rejected', async ({ request }) => {
    // Note: no `headers` here on purpose — we are pretending to be a stranger.
    const res = await request.get('/wp-json/wp/v2/users/me');

    // 401 = "Unauthorized". That is exactly what we expect and want here.
    expect(res.status()).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Test 3: A full write cycle — create a draft post, then delete it.
  // This shows POST (create) and DELETE (remove) with authentication.
  // We clean up after ourselves so the site isn't left with junk posts.
  // -------------------------------------------------------------------------
  test('can create and delete a draft post', async ({ request }) => {
    // Date.now() is the current time in milliseconds. We tack it onto the title
    // so every test run creates a uniquely-named post (no accidental clashes).
    const title = `Playwright API test ${Date.now()}`;

    // --- CREATE ---
    // POST sends data to the server to create something new.
    const create = await request.post('/wp-json/wp/v2/posts', {
      headers: wpAuthHeader(),
      // `data` is the JSON body. status:'draft' means it won't appear publicly.
      data: {
        title,
        status: 'draft',
        content: 'Created by an automated API test.',
      },
    });

    // 201 = "Created". WordPress returns this when a new post is made.
    expect(create.status()).toBe(201);

    // Read the created post the server sent back (it includes the new id).
    const created = await create.json();

    // The title field can come back as `.raw` (what we sent) or `.rendered`
    // (HTML-formatted). We accept either and check our text is in there.
    expect(created.title.raw ?? created.title.rendered).toContain('Playwright API test');

    // Confirm it really was saved as a draft, not published.
    expect(created.status).toBe('draft');

    // --- DELETE (cleanup) ---
    // Remove the post we just made, using its id from the create response.
    // `force: true` skips the trash and deletes permanently, so tests don't
    // pile up trashed posts over time.
    const del = await request.delete(`/wp-json/wp/v2/posts/${created.id}`, {
      headers: wpAuthHeader(),
      params: { force: true },
    });

    // Deletion should succeed...
    expect(del.ok()).toBeTruthy();

    // ...and WordPress confirms with a body containing deleted: true.
    const deleted = await del.json();
    expect(deleted.deleted).toBe(true);
  });
});
