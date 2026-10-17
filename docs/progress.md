# Progress log

What was built in each phase, and where it differs from `build-plan.md`. Newest first.

## After launch prep — changes from review

- **Tax is set per invoice.** Before, an invoice pointed to a rate saved in Settings, so with no rate in Settings the editor's Tax field only offered "No tax". Now each invoice stores its own percent: the editor's Tax field is a percent box, new invoices start with the Settings default (if any), and Apply tax works without a Settings rate. Sent invoices need no tax snapshot any more. Existing data is upgraded in the browser (Dexie version 2) and old backups (schemaVersion 1) are upgraded on import; both keep the percent each invoice used.
- The sample business is "Tagy Studio" instead of "Irsya Studio".
- The empty Overview's three cards match the Clients empty state, and the mobile tab bar stays above raised page content.

## Phase 6 — Backup, offline, polish and launch prep (done, deploy pending)

**Built**

- JSON backup: Export backup saves every store and the logo with a schemaVersion; Import validates the whole file (clear errors for non-backups, newer versions, damaged fields), shows what's in it and replaces everything in one transaction — a failed import changes nothing. Available from Settings, Overview and the first-visit screen.
- Backup reminder on Overview after 14 days without a backup (counted from the first invoice when there has never been one), with Later for the session.
- Offline: service worker precaches the app, fonts and PDF engine; installable manifest; updates prompt instead of reloading; persistent storage requested after the first invoice.
- Performance: every screen except Overview loads on demand; the backup module and first-visit screen too. Start chunk ~180 KB gzipped.
- Accessibility: axe checks (WCAG 2.2 AA) on every screen, desktop and mobile, with no serious issues.
- Deploy prep: Cloudflare Pages `_headers` (caching, strict CSP, security headers), setup steps in `docs/deploy.md`. A test runs the app under the CSP.

**Lighthouse** (production build, local)

| Page | Desktop perf / a11y / BP / SEO | Mobile perf / a11y / BP / SEO |
| --- | --- | --- |
| Overview | 100 / 100 / 100 / 100 | 91 / 100 / 100 / 100 |
| Settings | 100 / 100 / 100 / 100 | 91 / 100 / 100 / 100 |
| Clients | 100 / 100 / 100 / 100 | 92 / 100 / 100 / 100 |
| Templates | 99 / 96 / 100 / 100 | 79 / 96 / 96 / 100 |

The plan's target was ≥ 95. Desktop meets it. Mobile performance (simulated slow 4G) is held back by the ~180 KB start chunk (React, router, Dexie, Radix); Templates also loads its own chunk and template fonts, and its a11y / best-practices points are lost on the scaled invoice preview (tiny text and the design's light colours, which mirror the printed document).

**Differences from the plan**

- Design colours changed for contrast: coloured text uses new darker `*-ink` tones (danger, success, warning; accent-ink for links and "Sent"); `tile-muted` went from #6b7079 to #60656e. Dots, icons and fills keep the design's bright tones. Invoice templates keep their design colours.
- The CSP needs `wasm-unsafe-eval` (React-PDF's layout engine is WebAssembly) and `style-src 'unsafe-inline'` (inline styles in templates).
- SPA routes rely on Cloudflare Pages' built-in fallback (no `404.html`), so no `_redirects` file.

**Still to do (needs you)**

- Connect the GitHub repo in Cloudflare Pages and add the `tagy.mhirsd.com` custom domain — steps in `docs/deploy.md`.

## Phase 5 — Overview (done)

**Built**

- Overview: period menu (3 / 6 / 12 months, all time), Billed / Paid / Unpaid, stat tiles with the overdue amount, billed-per-month chart naming the best month, invoice list with status filters, search and a row menu (mark as sent / paid / unpaid, open, duplicate, PDF, back to draft, delete — paid and delete offer Undo).
- Mobile Overview: billed card with a trend chip against the previous period (decision 6), Paid / Unpaid, an overdue alert that filters the list, recent invoices with See all.
- First visit: welcome hero, setup checklist that ticks off, sample invoice preview, empty list, import hint.
- Sample data: 6 clients and 42 invoices numbered DEMO-…, removable from a banner without touching real records or numbering.
- Export CSV of the period's invoices (decision 4), plain decimal amounts, opens correctly in Excel.

**Differences from the plan**

- The period scopes the list as well as the figures (the design's "All 42" matches its 42 invoices in the period).
- Totals count only the default currency; other currencies show on a separate "Also billed" line (decision 7).
- The design's "8%" chips on stat tiles were placeholders; only the overdue amount chip is shown.
- Paid invoices get "Mark as unpaid" in the row menu (the reverse of Mark as paid), which the design didn't show.

## Phase 4 — Templates and PDF (done)

**Built**

- Minimal, Classic and Studio templates in HTML, alongside Bold, each with the fonts from the design (Geist / Geist Mono, Newsreader, Inter Tight, DM Sans / DM Mono), self-hosted.
- Templates screen: template cards with live thumbnails, accent, font, paper size and Show-on-invoice toggles (saved right away), preview of the latest invoice or a sample, Set as default and Reset; mobile layout.
- Print: `/print/:id` renders the bare invoice at paper width; the editor's Print button prints it from a hidden frame without leaving the page.
- PDF: the four templates redrawn with React-PDF from the same view model, fonts embedded, rows never split, headers repeat. Download from the desktop header, the hero, and the mobile status block / Review (which can mark the draft as sent). The engine loads on first download only.
- Tests check every template × paper size gives one page of the right size, and long invoices span pages.

**Differences from the plan**

- Templates lay out on a 560 px page instead of the design's 416 px. At 416 px the design's 10 px text prints at ~14 pt and a three-line invoice spilled onto a second page; at 560 px it prints at ~10.5 pt. Template gaps were tightened from 24–26 px to 20 px so the design invoice fits one US Letter page in every template.
- No shared layout primitives between HTML and PDF: each template has an HTML and a PDF version reading the same view model. Parity is checked by tests (page size, page count) rather than pixel diffs, which would differ between macOS and the Linux CI.
- PDF fonts are the Latin subsets, so currency symbols outside it (e.g. ₹) may not render in PDFs; $, €, £, ¥ do.
- The Font setting: Sans keeps each template's own type (Classic stays serif); Serif and Mono replace the text face.
- Template thumbnails are the real templates rendered small, not the hand-drawn mini pages from the design.

## Phase 3 — Settings, clients and the editor (done)

**Built**

- Settings: desktop bento and mobile grouped list with sub-pages; logo resized in the browser to a ≤ 512 px PNG; autosave with "All changes saved"; Clear all data behind a typed confirmation.
- Clients: card grid (desktop) and list (mobile), filters with counts, search, new / edit form in a side panel or bottom sheet, archive with Undo, delete for clients without invoices, empty state.
- Desktop editor: header with status menu and template switcher; hero card with client picker, figures per status, stepper and the one-step-forward action; mark-as-paid dialog; details, items (inline editing, reorder, Recent items), summary, notes and payment details; everything autosaves.
- Live preview: the Bold template rendered beside the form, plus a full-page preview.
- Mobile editor: Client → Details → Items → Review with a sticky action bar; existing invoices open on Review with a status block, Duplicate and Delete.

**Differences from the plan**

- The status flow (mark as sent / paid, undo, back to draft) was built in Phase 3 rather than Phase 5, because it is the editor's main action. Phase 5 adds it to the Overview row menu.
- A single default tax rate in Settings (shown as "Tax · 8%"); named or multiple rates were not needed by any screen.
- Line items reorder with Move up / Move down buttons instead of drag, which is also keyboard and screen-reader friendly.
- The Bold template adds a small business line (address, email, tax ID) and the notes, which the design board leaves out but a real invoice needs. "Pay now" is not shown (decision 2).
- Template chips on mobile Review don't show the counts from the design.
- Help & FAQ is not linked anywhere yet; there is no Help page in scope.
