# Progress log

What was built in each phase, and where it differs from `build-plan.md`. Newest first.

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
