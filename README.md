# Tagy

A free invoice maker that runs entirely in the browser. No account, no backend: invoices, clients and settings live in IndexedDB on the device, and can be exported as a JSON backup and imported on another device.

- Live at **tagy.mhirsd.com** (Cloudflare Pages)
- Design: `tagy.pen` (Pencil), Style C · Tile
- Plan and decisions: [`docs/build-plan.md`](docs/build-plan.md); what was built and how it differs: [`docs/progress.md`](docs/progress.md)

## Develop

Requires Node 22 (see `.nvmrc`).

```sh
npm install
npm run dev          # http://localhost:5173
```

| Command                                                 | What it does                                                |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run build`                                         | Type-check and build to `dist/` (with the service worker)   |
| `npm run preview`                                       | Serve the production build                                  |
| `npm test`                                              | Unit tests (Vitest, in-memory IndexedDB)                    |
| `npm run coverage`                                      | Unit tests with coverage; `src/domain` must stay at 100%    |
| `npm run e2e`                                           | Browser tests (Playwright: desktop Chromium, mobile WebKit) |
| `npm run lint` / `npm run typecheck` / `npm run format` | oxlint, TypeScript, Prettier                                |

First run of the browser tests needs the browsers: `npx playwright install chromium webkit`.

In development, `/kit` shows every UI component for comparing with the design.

## How it fits together

| Folder          | Holds                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `src/domain`    | Pure logic: money and rounding, totals, dates, status, overview stats, CSV. Fully unit-tested.           |
| `src/db`        | Dexie database, repositories, backup export / import, sample data. The only code that touches IndexedDB. |
| `src/templates` | The view model and the four invoice templates in HTML (preview, print).                                  |
| `src/pdf`       | The same templates for React-PDF (download), loaded on demand.                                           |
| `src/features`  | One folder per screen: overview, editor, templates, clients, settings.                                   |
| `src/ui`        | The Tile component kit.                                                                                  |

Money is stored as integer minor units and rounded half-up at each step. Every edit autosaves. Nothing leaves the browser except files the user downloads.

## Deploy (Cloudflare Pages)

1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the `tagy` repository.
2. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. Deploy. Every push to `main` deploys to production; other branches get preview URLs.
4. **Custom domains → Set up a custom domain →** `tagy.mhirsd.com`. If `mhirsd.com` is on Cloudflare DNS, the CNAME is added for you; otherwise add a `CNAME` record `tagy → <project>.pages.dev` at your DNS provider.

Nothing else is needed:

- **SPA routes** (`/invoices/…`, `/settings`) work because the build has no `404.html`, so Pages serves `index.html` for unknown paths.
- **`public/_headers`** sets long-term caching for hashed assets, no-cache for `index.html` and `sw.js`, and a strict Content-Security-Policy (no third-party requests; `wasm-unsafe-eval` is there because the PDF engine uses WebAssembly). `e2e/csp.spec.ts` runs the app under this policy.
- **Updates**: the service worker shows "A new version of Tagy is ready — Reload" instead of reloading on its own.
