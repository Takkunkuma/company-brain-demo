# Company Brain: interactive MVP demo

A clickable front-end prototype for **Company Brain** (CMU, Team "The Invent-tories"). It walks one scenario end to end: a customer cuts a big order, and Maya, the buyer/planner, works out what is excess, which numbers to trust, and hands a decision package to her manager, Daniel.

All data is fictional. There is no backend, no login, no API keys, and no AI calls. The assistant is a scripted intent matcher.

The full spec is in [company-brain-mvp-spec.md](company-brain-mvp-spec.md). Section 12a lists the decisions made to fill gaps in the original spec.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Other scripts:

```bash
npm test          # unit tests for calculations and the full demo flow
npm run build     # typecheck + production build into dist/
npm run preview   # serve the production build locally
```

## Deploy (static site)

The build output is plain static files in `dist/`. Routing is hash-based (`/#/impact`), so deep links and refreshes work on any static host with **no rewrite rules**.

**Vercel (recommended)**

1. Push this repo to GitHub.
2. In Vercel, choose *Add New → Project*, import the repo. It auto-detects Vite (build `npm run build`, output `dist`).
3. Share the **production** URL (`<project>.vercel.app`). Preview-deployment URLs are behind Vercel login by default, so teammates without a Vercel account can't open them.

Or from the terminal: `npx vercel --prod`.

Notes for a team:
- On Vercel's free Hobby plan, only one person owns the project. If teammates push to a *private* repo, their commits may not deploy. Either keep the repo public, let one person merge and deploy, or use Netlify / GitHub Pages instead.
- After the first deploy, replace `/og.png` in `index.html` with the full URL (`https://<your-domain>/og.png`) so link previews show the image in Slack, iMessage, and other apps.

**Netlify:** drag the `dist/` folder onto https://app.netlify.com/drop.

**GitHub Pages:** works as-is (relative asset paths + hash routing). Publish the `dist/` folder.

## How teammates should use it

- First visit shows a welcome card with a 3-minute **Guided tour**.
- Progress is saved **in each person's browser** (localStorage). Teammates don't share state, so everyone gets their own copy of the scenario.
- To show the Maya → Daniel handoff, use the **persona switcher** (top right) in one browser.
- **Reset demo** (top bar) returns everything to Thursday 9:00 AM.
- Best on a laptop. Tablet works; phones get a simplified nav.

## What to try (acceptance checklist)

1. **Inventory:** click any source chip to see the ERP row, spreadsheet cell, or message behind a number.
2. Resolve **MCB-220: ERP 1,200 vs Excel 900** with *Confirm usable = 900*.
3. **Activity:** add Priya's chat message to the shared view. Add Luis's "220 on hold" message to raise a new conflict, then confirm it on Inventory. Watch usable drop to 860, excess drop to 660, and the first conflict re-open.
4. **Impact & Options:** *Analyze impact*, drag the demand slider, and tick options to combine them.
5. **Decisions:** generate the package, *Send to Daniel*, then *Simulate: an input changes*. Switch to Daniel to approve or ask a question.
6. **Ask** (top right): try the suggested questions. Every number is cited.
7. **Onboarding → step 2:** toggle the "usable stock" definition and watch numbers change across the app.

## Project structure

```
src/
  data/scenario.ts      all fake data (edit numbers here only)
  lib/calc.ts           pure calculations (usable, excess, option costs) + tests
  store/store.ts        app state and actions (zustand, persisted to localStorage)
  store/derive.ts       turns state into facts with provenance, conflicts, option plan
  components/           source chips, provenance drawer, toasts, layout, UI primitives
  features/             inventory, activity, impact, decision, connections,
                        onboarding, assistant, tour, notdoing
```

Every number on screen is a *fact* built in `derive.ts` with its source, timestamp, and who confirmed it. That is what powers the chips, the drawer, the assistant's citations, and the "input changed" alerts on decision packages.

## Choices made where the spec was open

- **Demo clock:** Thu Nov 19, 2026, 9:00 AM. Each action moves the clock forward a few minutes.
- **Option math:** selected options apply in the order you tick them. Each covers `min(capacity, remaining excess)`. *Hold* prices whatever is left at 2%/month for 3 months.
- **Supplier date:** until someone confirms it, the ERP date (system of record) is used, with a conflict flag.
- **Extra cast and data:** Luis Romero (production lead), work orders WO-7740 and WO-7752, and the supplier contract and finance-policy excerpts are invented to back the option costs.
- **Not built:** dark mode (optional in the spec).

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS v4, Zustand, Recharts, Lucide icons, Inter (self-hosted via Fontsource), Vitest.
