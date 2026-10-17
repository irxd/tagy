# Deploying to Cloudflare Pages

Tagy is a static site, so any static host works. This is the setup for the live site at `tagy.mhirsd.com`.

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
