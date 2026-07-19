// ---------------------------------------------------------------------------
// Blog post tests (public reading, no login needed)
// ---------------------------------------------------------------------------
// WordPress exposes published posts at /wp-json/wp/v2/posts. Anyone can read
// them. These tests check listing, the shape of a single post, and how the
// API behaves when we ask for a post that doesn't exist.
// ---------------------------------------------------------------------------

import { test, expect } from '@playwright/test';

test.describe('wp/v2 posts', () => {
  // -------------------------------------------------------------------------
  // Test 1: Listing posts, and checking the pagination info.
  // -------------------------------------------------------------------------
  test('lists posts with pagination headers', async ({ request }) => {
    // Ask for posts. `params` become the "?key=value" bits in the URL.
    // per_page: 5 means "give me at most 5 posts".
    const res = await request.get('/wp-json/wp/v2/posts', {
      params: { per_page: 5 },
    });

    // The request should succeed.
    expect(res.ok()).toBeTruthy();

    // The body should be a list (array) of posts.
    const posts = await res.json();
    expect(Array.isArray(posts)).toBeTruthy();

    // We asked for at most 5, so we should never get more than 5 back.
    expect(posts.length).toBeLessThanOrEqual(5);

    // WordPress puts totals in the response headers rather than the body:
    //   x-wp-total      = total number of posts on the site
    //   x-wp-totalpages = how many pages that becomes at this page size
    // We just confirm those headers are present.
    expect(res.headers()).toHaveProperty('x-wp-total');
    expect(res.headers()).toHaveProperty('x-wp-totalpages');
  });

  // -------------------------------------------------------------------------
  // Test 2: A single post should have the fields we expect.
  // -------------------------------------------------------------------------
  test('each post has the expected shape', async ({ request }) => {
    // Grab just one post to inspect it.
    const res = await request.get('/wp-json/wp/v2/posts', {
      params: { per_page: 1 },
    });
    expect(res.ok()).toBeTruthy();

    const posts = await res.json();

    // If the site has no published posts yet, there's nothing to check —
    // so we skip (rather than fail) this test in that case.
    test.skip(posts.length === 0, 'No posts published on the site.');

    // Look at the first (and only) post we asked for.
    const post = posts[0];

    // toMatchObject checks that these fields exist with the right types/values,
    // while ignoring any other fields the post may also have.
    //   expect.any(Number) means "some number, we don't care which".
    expect(post).toMatchObject({
      id: expect.any(Number),
      status: expect.any(String),
      type: 'post',
    });

    // The title comes as an object with a "rendered" (HTML) version.
    expect(post.title).toHaveProperty('rendered');

    // The public link to the post should point at this site.
    expect(post.link).toContain('sibi.win');
  });

  // -------------------------------------------------------------------------
  // Test 3: Asking for a post that doesn't exist should fail cleanly.
  // (A good API returns a clear "not found" error, not a crash.)
  // -------------------------------------------------------------------------
  test('returns 404 for a non-existent post', async ({ request }) => {
    // 999999999 is an id that almost certainly doesn't exist.
    const res = await request.get('/wp-json/wp/v2/posts/999999999');

    // 404 = "Not Found" — the correct, expected response here.
    expect(res.status()).toBe(404);

    // WordPress also includes a machine-readable error code in the body.
    const body = await res.json();
    expect(body.code).toBe('rest_post_invalid_id');
  });
});
