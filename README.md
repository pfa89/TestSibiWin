# TestSibiWin — Playwright API tests

Automated API tests for the WordPress site **Quality Ladles** at
[test.sibi.win](https://test.sibi.win), using the
[Playwright test runner](https://playwright.dev/docs/test-api-testing).

These are **API tests** (they call the site's REST endpoints directly over
HTTP) — no browser is launched, so they run fast and need no browser download.

## Setup

1. Install dependencies (already done once, repeat after cloning):
   ```bash
   npm install
   ```
2. Create your local secrets file by copying the example:
   ```bash
   cp .env.example .env
   ```
   Then fill in the values. `.env` is git-ignored and never committed.

## Running tests

```bash
npm test          # run everything (list reporter)
npm run test:ui   # open Playwright's interactive UI mode
npm run report    # open the HTML report from the last run
```

Run a single file or filter by name:

```bash
npx playwright test tests/api/posts.spec.ts
npx playwright test -g "non-existent post"
```

## What's tested

| File | What it covers | Auth? |
| --- | --- | --- |
| `tests/api/rest-root.spec.ts` | The `/wp-json/` API root loads and lists the `wp/v2` + `wc/v3` features | No |
| `tests/api/posts.spec.ts` | Listing posts, a single post's shape, and 404 handling | No |
| `tests/api/auth.spec.ts` | Identity (`/users/me`), rejecting anonymous access, and a create-then-delete post cycle | Yes |

The authenticated tests **skip automatically** if `WP_USERNAME` /
`WP_APP_PASSWORD` are missing from `.env`, so the suite still runs cleanly
without secrets.

## How authentication works

WordPress **Application Passwords** are used with HTTP Basic Auth. The helper in
`tests/helpers/auth.ts` reads `WP_USERNAME` and `WP_APP_PASSWORD` from `.env`
and builds the `Authorization: Basic ...` header. Create app passwords in
WordPress under **Users → Profile → Application Passwords**.

## Continuous integration

`.github/workflows/api-tests.yml` runs the suite on every push/PR to `main`
(and via the manual "Run workflow" button). To let the authenticated tests run
in CI, add these as **repository secrets** (Settings → Secrets and variables →
Actions). Without them, the authenticated tests skip and the rest still run.

- `WP_USERNAME`
- `WP_APP_PASSWORD`
- `WC_CONSUMER_KEY` (optional, for future WooCommerce tests)
- `WC_CONSUMER_SECRET` (optional)

## Project layout

```
playwright.config.ts   # base URL, timeouts, workers, reporters
.env / .env.example    # credentials (real / template)
tests/
  helpers/auth.ts      # builds the Basic Auth header from .env
  api/                 # the test specs
```

## Notes

- The site is on shared hosting, so the config uses a modest worker count, a
  60s per-test timeout, and one retry to absorb transient slowness.
- Add WooCommerce Store/Products tests by pointing new specs at the `wc/v3`
  namespace and supplying `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` in `.env`.
```
