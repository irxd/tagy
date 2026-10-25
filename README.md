# Tagy

A free invoice maker that runs entirely in your browser. No account, no server, no tracking: your invoices, clients and settings are stored on your device, and nothing leaves it unless you download it.

**Try it at [tagy.mhirsd.com](https://tagy.mhirsd.com).**

## What it does

- **Invoices**: add items, discount and tax, and see the totals and a live preview of the page as you type. Every change saves automatically.
- **Statuses**: move an invoice from Draft to Sent to Paid. Tagy flags it as Overdue once the due date passes. Each change can be undone.
- **Templates**: four designs (Swiss Ledger, Serif Ledger, Editorial Mono, Ruled Index) with a choice of accent colour, heading and body fonts, and paper size (A4 or US Letter).
- **PDF and print**: download a real PDF, made in the browser, or print straight from the page.
- **Clients**: save a client once and pick them on the next invoice. Each client shows what they've been billed and what's still unpaid.
- **Overview**: totals for a period, a monthly chart, search and filters. Exports to CSV for your accountant.
- **Backups**: export everything to one JSON file and import it on another device or browser.
- **Works offline**: after the first visit it runs without a connection, and it can be installed to a phone's home screen.
- **Desktop and mobile**: each has its own layout, not a squeezed version of the other.

## Your data

Everything lives in the browser's IndexedDB on your device. There is no backend and no analytics, and the site's security policy blocks requests to any other server. This means:

- Nobody else can see your invoices, including whoever runs the site.
- Clearing your browser data deletes your invoices. Tagy reminds you to export a backup now and then, and asks the browser to keep its storage.
- To move to another device, export a backup there and import it.

## What's next

Planned:

- **Animation**: add motion to the interface, such as screen changes, sheets and dialogs, and status changes, and respect the system's reduced-motion setting.
- **Interaction and UX**: improve how the app feels to use, from the feedback on each action to the flow of common tasks, on desktop and mobile.

## How it's built

React 19, TypeScript and Vite, with Tailwind CSS for styling. Data is stored with Dexie (IndexedDB), PDFs are made with React-PDF, and Workbox handles offline support. The interface uses Radix UI and Vaul.

| Folder          | Holds                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `src/domain`    | Pure logic: money and rounding, totals, dates, statuses, overview stats, CSV. Fully unit-tested.          |
| `src/db`        | The database, data access, backup export and import, data upgrades. The only code that touches IndexedDB. |
| `src/templates` | The four invoice templates in HTML, used for the preview and printing.                                    |
| `src/pdf`       | The same templates for the PDF download, loaded only when needed.                                         |
| `src/features`  | One folder per screen: overview, editor, templates, clients, settings.                                    |
| `src/ui`        | Shared components.                                                                                        |
| `e2e`           | Browser tests.                                                                                            |

Some choices worth knowing about:

- **Money** is stored as whole cents (minor units), never as decimals, and rounded half-up at each step, so totals are always exact.
- **One view model** feeds both the on-screen templates and the PDF, so the preview matches the PDF you download.
- **Sent invoices are frozen**: the client and business details are copied onto the invoice when it's sent, so later edits elsewhere don't rewrite it.
- **Overdue** is worked out from the due date when the invoice is displayed, never stored.

The design lives in `tagy.pen`, a Pencil file. `docs/build-plan.md` has the original plan and the decisions behind it, and `docs/progress.md` has what was built and where it differs.

## Running it locally

Requires Node 22 or later.

```sh
npm install
npm run dev          # http://localhost:5173
```

| Command                                                 | What it does                                                |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run build`                                         | Type-check and build to `dist/`, with the service worker    |
| `npm run preview`                                       | Serve the production build                                  |
| `npm test`                                              | Unit tests (Vitest, with an in-memory IndexedDB)            |
| `npm run coverage`                                      | Unit tests with coverage; `src/domain` must stay at 100%    |
| `npm run e2e`                                           | Browser tests (Playwright: desktop Chromium, mobile WebKit) |
| `npm run lint` / `npm run typecheck` / `npm run format` | oxlint, TypeScript, Prettier                                |

The browser tests need the browsers installed first: `npx playwright install chromium webkit`. In development, `/kit` shows every UI component on one page.

## Deploying

The build is a static site in `dist/` and can go on any static host. `public/_headers` sets the caching and security headers for Cloudflare Pages, where the live site runs. The setup steps are in [`docs/deploy.md`](docs/deploy.md).
