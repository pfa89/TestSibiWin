# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Playwright **API tests** for the WordPress site at `test.sibi.win`.
API tests call the site's web endpoints directly — no browser opens.
There is nothing to build and no linter; it's a test-only project.

## How to run the tests

- `npm test` — run everything
- `npm run test:ui` — run in the visual UI
- `npm run report` — open the report from the last run
- Run just one file: `npx playwright test tests/api/posts.spec.ts`
- Run tests whose name matches text: `npx playwright test -g "non-existent post"`

## Things worth knowing before editing

- **Short URLs work on purpose.** The site address is set once in
  `playwright.config.ts`, so tests only write the path part
  (e.g. `/wp-json/wp/v2/posts`), not the full `https://...`.

- **The settings are tuned for slow shared hosting.** 4 workers, a 60-second
  timeout, and 1 retry. This prevents random timeout failures — please keep it.

- **Login uses a WordPress "Application Password."** The username and password
  live in the `.env` file. The helper `tests/helpers/auth.ts` turns them into
  the login header — add `headers: wpAuthHeader()` to a request that needs login.
  Tests that need login skip themselves automatically if `.env` has no
  credentials, so the rest of the suite still runs.

- **Clean up what you create.** A test that adds something (like a post) must
  delete it again at the end (`DELETE ...?force=true`).

## Credentials

`.env` holds the real credentials and is never committed (it's gitignored);
`.env.example` is the blank template. The GitHub Actions pipeline
(`.github/workflows/api-tests.yml`) runs the tests on every push and gets its
credentials from repository **secrets**, not from `.env`.
