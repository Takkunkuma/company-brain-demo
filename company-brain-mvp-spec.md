# Company Brain: Interactive MVP Spec

> Purpose of this file: hand it to Claude Code as the single source of truth for building a clickable, deployable demo of Company Brain. Build the demo exactly as described here. Where something is unspecified, make a sensible choice and note it in the README.

---

## 1. What we are building

An **interactive front-end prototype** (no real backend, no real integrations) that lets teammates click through one realistic scenario and *feel* how Company Brain solves the problem. It is a demo for a class project (CMU, Team "The Invent-tories"), not a production system. It will be deployed as a public static site so teammates can open a link and play with it.

**The demo scenario in one sentence:** a customer cuts a big order, and a buyer/planner has to figure out which inventory is now excess, which numbers to trust, and what to do about it, then hand a decision package to their manager.

### Goals
- Make each pain point visible, then show the fix, so a viewer *gets it in under 3 minutes*.
- Every major feature is interactive (click, toggle, drag, type), not a static screenshot.
- Look like a polished, modern B2B product (not a class mockup).

### Non-goals
- No real ERP / Excel / email / chat integrations. All data is fake and lives in local JSON.
- No login, no database, no server. No real AI calls (the assistant is scripted; see Feature 9).
- No write-back to any system. The product is **read-only** by design.

---

## 2. Value proposition (team-approved, use verbatim in the app)

> For manufacturing supply chain and inventory teams that spend hours reconciling inconsistent information across systems, **Company Brain** turns unexpected order changes into informed inventory decisions. Unlike ERPs and shared spreadsheets that show records but not which version is current, it keeps one source-backed view across ERP, spreadsheets, and chat, showing who confirmed each number and when, and flagging conflicting numbers. Teams stop rechecking the same facts and clear leftover stock with confidence.

Show a short version as the app tagline: **"One source-backed view. Confident inventory decisions."**

---

## 3. Users

| Persona | Role | What they need from the demo |
|---|---|---|
| **Primary: Buyer / Planner** (demo default, "Maya Ortiz") | Procurement buyer/planner at a manufacturer | Know which numbers are current and usable, understand impact of an order change, prepare a decision for the manager |
| **Secondary: Production & Inventory Control Manager** ("Daniel Reyes") | Approves the decision | Receives a clean decision package and can see what data it relied on |

Names, company and numbers are fictional.

---

## 4. Problems it solves (each must be visibly demonstrated)

Evidence comes from our customer interviews and journey map (H1–H5 are the team's hypotheses).

| # | Pain point | Evidence | Where the demo shows the fix |
|---|---|---|---|
| P1 | **Three versions of the truth.** ERP, Excel and chat disagree and nobody knows which is current. | "Three different pieces of information about the same situation." H1 validated (3 of 5). | F1, F3 |
| P2 | **"On screen" is not "usable."** Stock shown in the ERP includes quality holds and reservations. | "A number on screen doesn't mean all of it is usable." | F1, F8 (editable definitions) |
| P3 | **Everyone uses Excel + ERP; switching is not an option.** | Every interviewee works in both; H5 adoption barrier. | F2 |
| P4 | **Updates live in chat and email and are never recorded.** | Fast coordination happens in WeChat/email; someone consolidates by hand. | F4 |
| P5 | **Impact of an order change is slow to assess**, collected by hand from many departments. | Journey map low point; H4 (knowing stock doesn't say what to do). | F5 |
| P6 | **Deciding what to do with leftover stock** means hand-modeling options in Excel while options expire. | Journey stage 3; H4. | F6 |
| P7 | **Preparing the decision is slow, and decisions go stale** when inputs change after approval. | H2 evidence (approval is fast, prep is slow); "reasons not recorded in any system." | F7 |
| P8 | **Past dashboards weren't trusted** and took months to adopt. | "6 weeks to set up, months to adopt." H5. | F8 |
| P9 | **AI isn't trusted for decisions**, only summarizing and search. | Interviewees use AI for summaries only. | F9 |

---

## 5. Features to build (the 9 included elements)

For each: what it is, what the user can **do** in the demo, and the pain point it addresses.

### F1. Read-only, source-backed inventory view  *(P1, P2)*
One screen showing usable stock, supplier dates, open orders and pending decisions per material.
- Every number carries a **provenance chip**: source (ERP / Excel / Email / Chat), timestamp, and "confirmed by <name>".
- Clicking a chip opens a side drawer with the source detail (the ERP row, the spreadsheet cell, the chat message).
- A visible **"Usable vs. On screen"** breakdown for each material (on-hand minus quality hold minus reserved = usable).
- Prominent "Read-only" badge in the header.

### F2. Works alongside ERP and Excel  *(P3)*
A **Connections** panel that shows connected sources (ERP, Excel files, email, group chat, PDFs) with last-sync times and a "read-only" lock icon on each. Includes a mock **Excel add-in** view: a side panel inside a fake spreadsheet that shows the confirmed number next to the cell the planner is editing. Message: *you keep your tools; we reconcile them.*

### F3. Conflict flags, change log, and pending decisions  *(P1, P7)*
- **Conflict flags:** when two sources disagree on the same item, show a banner with both values side by side, who/when for each, and a **"Which is current?"** action (Confirm ERP / Confirm Excel / Mark as needs check). Confirming updates the number and its "confirmed by" chip.
- **"Since you last looked" change log:** a timeline of what changed (order cut, supplier email, QC hold) with diffs (old → new).
- **Pending decisions list:** open decisions with owner and due date.
- The conflict view should read like Excel's compare, not a generic dashboard.

### F4. Chat and email capture  *(P4)*
A feed panel of captured messages (WeChat-style group chat, email) with the **key update extracted** and tagged (e.g., "Supplier date moved to Dec 9"). A button **"Add to shared view"** pushes the extracted fact into F1 with the message as its source. Show one message that turns into a conflict (feeds F3).

### F5. Order-change impact analysis  *(P5)*
Trigger: a banner "Customer order changed". Clicking **"Analyze impact"** animates a computation and shows:
- Affected materials, WIP and open POs
- Excess quantity per material and **estimated financial exposure**
- Which POs can still be adjusted (with cancellation window and fee)
Present as a clean table plus a small bar chart (excess units by material).

### F6. Leftover-stock options and what-if, side by side  *(P6)*
Option cards (Cancel/reduce PO, Reallocate to another line, Return to supplier, Hold/sell down) compared on **cost, risk, timing**. Interactivity:
- A **demand slider** (e.g., remaining demand -40% to +20%) that live-updates excess quantity and every option's cost.
- Users can **combine options** (checkbox stack) and see the combined residual excess and total cost.
- Highlight trade-offs; **do not auto-pick**. People decide.

### F7. Decision package with pinned inputs  *(P7)*
Generates a one-page package for the manager: orders at risk, revenue at risk, days of supply, cost of each option, chosen option(s). It **pins the exact data versions** used (list of inputs with source + timestamp). Interactive:
- Button **"Simulate: an input changes"** (e.g., supplier date moves) → a toast/alert appears: "An input to this decision changed" with a diff and a "Review decision" action.
- A **"Send to Daniel"** button that shows a confirmation and flips the decision state to *Awaiting approval* (mock only).

### F8. Guided onboarding and data-trust service  *(P2, P8)*
A short stepper: (1) map data sources, (2) **agree metric definitions**, (3) review first conflicts together.
- In step 2 the user edits the definition of **"Usable stock"** with toggles (exclude quality hold, exclude reserved, include inbound within N days). Changing a toggle **recalculates numbers live** across the app, so people see why definitions matter.
- Step 3 pre-loads the demo conflicts.
- Frame as a *people + software* service ("your Company Brain team sits with you").

### F9. Cited assistant  *(P9)*
A chat panel ("Ask Company Brain"). **Scripted, no LLM call.** Match user input to canned intents by keyword; always answer with **source citation chips** and never state an uncited number. Provide suggested prompts. Required intents:
- "Why do the ERP and Excel numbers differ?" → explains hold + reserved, cites ERP row and Excel cell
- "What changed since yesterday?" → summarizes change log
- "How much of MCB-220 is excess?" → number with citation to F5 analysis
- "Who confirmed the supplier date?" → name/time/source
- Fallback: "I can only answer with a source. Try one of these…"
Add a footer: *"The assistant explains and drafts. People make every decision."*

---

## 6. Explicitly excluded (do not build; show as a small "What we don't do" panel)
- **ERP replacement or write-back**: read-only; ERP stays the system of record (also lowers IT/security hurdle for a pilot).
- **Autonomous AI decisions / auto-ordering**: people make every decision.
- **Approval routing**: approvals are already clear and fast (H2 invalidated).
- **Demand forecasting engine**: users enter their own demand scenarios (F6 slider); the product never predicts demand (H3 invalidated).

---

## 7. Demo scenario and sample data

Fictional manufacturer **"Halden Industrial"**; customer **"Northwind Controls"**. Keep all data in a single `src/data/scenario.ts` (or JSON) so numbers can be edited in one place. Keep calculations derived from the data, not hard-coded in components, so the demand slider, definition toggles and "confirm" actions all update consistently.

**The story:** Thursday morning, Northwind cuts order **PO-48213** for drive assembly **DA-300** from 2,000 to 800 units (a 1,200-unit cut). Maya must decide what to do with the extra material before a supplier cancellation window closes.

**Primary material: MCB-220 (motor controller board)**, unit cost $42, 1 per DA-300.

| Fact | Value | Source |
|---|---|---|
| On hand (on screen) | 1,200 | ERP, synced Thu 6:00 AM |
| Quality hold | 180 | ERP QC status |
| Reserved for WO-7731 | 120 | ERP |
| **Usable** (1,200 − 180 − 120) | **900** | derived; matches planner Excel |
| Planner Excel says | 900 | `Planner_Inventory_v7.xlsx`, edited by Wei Chen Wed 4:40 PM |
| Open inbound PO-9921 | 600 units, ERP date Dec 2 | ERP |
| Supplier email says | Dec 9 | Email from supplier, Thu 7:15 AM |
| Remaining demand after cut | 800 | Order PO-48213 (new qty) |

**Derived values:** usable 900 + inbound 600 = 1,500 supply vs 800 demand → **700 excess**, exposure 700 × $42 = **$29,400**. Revenue reduction from cut: 1,200 units × $310 = **$372,000**.

**Seeded conflicts (start unresolved):**
1. MCB-220 on-hand: ERP 1,200 vs Excel 900 (resolved by explaining the definition difference; user can "Confirm usable = 900").
2. PO-9921 arrival date: ERP Dec 2 vs supplier email Dec 9.

**Options for the 700 excess** (all costs derived from inputs):
- **Reduce PO-9921 by 600**: fee 8% → $2,016; risk low; must act before **Nov 28** cancellation window.
- **Reallocate 250 to line DA-310** over 6 weeks: $0 direct cost; risk medium (depends on DA-310 demand); timing 6 weeks.
- **Return 100 to supplier**: 15% restocking → $630; risk low; timing 2 weeks.
- **Hold remainder**: carrying cost 2%/month on residual value; risk of obsolescence.
(With the 600 PO cut + 100 return the residual is 0; with the demand slider moved, residuals change.)

**Other materials** (for table richness; invent plausible numbers): AH-114 aluminum housing, WH-07 wiring harness, PM-55 power module. At least one should show no excess and one a minor excess.

**Captured messages (F4):** a WeChat-style group chat from the buyer, production lead and supplier rep; an email from the supplier moving the date; a note from production about the QC hold. Use realistic, short, slightly messy messages.

**People:** Maya Ortiz (buyer/planner, user), Wei Chen (planner who maintains the Excel), Daniel Reyes (manager, approver), Priya (supplier rep). All fictional.

---

## 8. Suggested demo flow (guided tour, optional)

Provide an optional "Guided tour" button that walks through, with tooltips:
1. Land on **Inventory view** → see the two conflict flags.
2. Resolve the MCB-220 conflict by opening the provenance chip and confirming "usable = 900".
3. **Chat capture** → add the supplier's new date to the shared view.
4. **Customer order changed** banner → Analyze impact.
5. **Options** → drag the demand slider, combine options.
6. **Decision package** → send to Daniel → simulate an input change → see the alert.
7. Open the **Assistant** and ask "Why do the ERP and Excel numbers differ?"
8. Peek at **Onboarding** → change the "usable" definition and watch the numbers change.

Also provide a **"Reset demo"** button that restores the initial state.

---

## 9. Information architecture

Left sidebar: **Inventory** (F1, F3 flags) · **Activity** (F3 change log + pending decisions, F4 feed) · **Impact & Options** (F5, F6) · **Decisions** (F7) · **Connections** (F2) · **Onboarding** (F8) · **What we don't do** (Section 6).
Top bar: product name, "Read-only" badge, persona switcher (Maya ↔ Daniel; Daniel sees the Decisions view with approve/ask-question actions), "Reset demo", "Guided tour".
Right slide-over: Ask Company Brain (F9), available from every page.
Provenance drawer (F1) available from every number.

---

## 10. Design direction

- **Feel:** calm, trustworthy, modern B2B SaaS (think Linear / Stripe dashboard quality). Clean, lots of whitespace, one strong accent color.
- **Color:** neutral light background with a deep indigo or teal accent; semantic colors for status only (amber = conflict, red = excess/risk, green = confirmed). Support dark mode if time allows.
- **Provenance is the hero:** small, consistent source chips (icon + name + time) used everywhere; "confirmed by" avatar chips. This is the visual signature of the product.
- **Typography:** Inter (or similar), tabular numerals for all quantities.
- **Motion:** subtle, purposeful (number count-ups on recalculation, chips highlighting when a value changes, slide-over drawers, toast alerts). No gratuitous animation.
- **Data viz:** a few simple charts only (excess by material bar chart; option cost comparison). Use accessible colors, labels and tooltips.
- Responsive down to tablet; desktop is the priority.
- Accessibility: keyboard navigable, visible focus states, sufficient contrast, aria labels on chips and drawers.

---

## 11. Technical approach

- **Stack:** Vite + React + TypeScript + Tailwind CSS. Optional: shadcn/ui or Radix for primitives, Framer Motion for animation, Recharts for charts, Zustand (or React context) for state.
- **State:** a single in-memory store seeded from `scenario.ts`. All derived values (usable stock, excess, option costs, decision package totals) computed from it through pure functions. Persist to `localStorage` optionally so teammates keep their state; always provide Reset.
- **No backend, no API keys, no env secrets.** The assistant is a deterministic intent matcher.
- **Deploy:** static build to **Vercel** (or Netlify / GitHub Pages). Include a `README.md` with local run (`npm install && npm run dev`) and deploy steps. Add a basic `<title>`, favicon and social preview.
- **Quality:** TypeScript strict, small tested pure functions for the calculations (a few unit tests for usable stock, excess, option cost, residual), and a clean component structure.

Suggested structure:
```
src/
  data/scenario.ts        # all fake data
  lib/calc.ts             # pure derivations (usable, excess, costs)
  store/                  # app state + actions (confirm, add-to-view, simulate-change, reset)
  components/             # Chip, ProvenanceDrawer, ConflictBanner, OptionCard, Slider, Toast ...
  features/               # inventory, activity, impact, options, decision, connections, onboarding, assistant
  App.tsx
```

---

## 12. Acceptance criteria

A teammate with no context can, within a few minutes:
1. See where each key number came from and who confirmed it (F1).
2. Resolve a conflict and watch the shared number and its confirmation update (F3).
3. Add a chat/email fact to the shared view (F4).
4. Run the order-change impact analysis and see excess and dollar exposure (F5).
5. Move the demand slider and combine options and watch costs and residuals update live (F6).
6. Generate a decision package, send it, and trigger the "input changed" alert (F7).
7. Change a metric definition and see numbers recalculate (F8).
8. Ask the assistant at least 4 scripted questions and get cited answers only (F9).
9. See the excluded items clearly stated, and a persistent "Read-only" indicator.
10. Hit **Reset demo** at any time and start over.

Also: no console errors, no dead buttons (every visible control does something), loads quickly, works on the deployed URL.

---

## 12a. Resolved decisions (added after feasibility review)

These close gaps in sections 5–7. Where they conflict with earlier text, these win.

1. **Demo clock.** The demo's "now" is **Thu Nov 19, 2026, 9:00 AM**; each user action advances the clock a few minutes. The PO-9921 cancellation window closes **Nov 28** (9 days out).
2. **Option quantities are capped by the excess that remains.** Selected options are applied in the order the user checks them; each takes `min(capacity, remaining excess)`. Costs are computed on the applied quantity, so the demand slider changes every option's cost. Residual excess never goes below 0.
3. **Shortage state.** If supply < demand (e.g. after definition or input changes), excess is 0, a shortage is shown, and options that reduce supply are flagged.
4. **"Hold remainder"** does not remove units; it prices the residual at 2%/month for **3 months** (configurable in `scenario.ts`).
5. **Inbound counted once.** Supply for excess = usable on-hand + all open inbound. The F8 "include inbound within N days" toggle only changes the *displayed* usable number, never double-counts inbound in excess.
6. **Confirmations are tied to the definition.** Confirming "usable = 900" stores the value. If a definition change (F8) or a newly confirmed input moves usable away from the confirmed value, the conflict re-opens with an explanation.
7. **The ERP-vs-Excel on-hand conflict** uses an "Explain & confirm usable" action rather than "Confirm ERP / Confirm Excel", since it is a definition difference, not a disagreement.
8. **Extra inputs:** working days per month = 20 (days of supply = usable ÷ daily usage); WIP orders WO-7740 / WO-7752; production lead **Luis Romero** (fictional) joins the cast.
9. **One chat message creates a new conflict:** Luis reports the QC hold is 220, not 180 (ERP). Confirming the chat value cascades: usable → 860, excess → 660, and the usable confirmation re-opens.
10. **Daniel's actions:** *Approve* → state *Approved*. *Ask a question* → state *Question from Daniel* with his text; Maya can reply and resend.
11. **Shared state:** state is per browser (localStorage, versioned). The Maya ↔ Daniel handoff is shown with the persona switcher in one browser.
12. **Routing:** hash-based (`/#/impact`) so deep links and refreshes work on any static host with no rewrite rules.

---

## 13. Build order (suggested)

1. Scaffold, design tokens, layout shell, scenario data and calc functions (with tests).
2. F1 Inventory view + provenance chips and drawer.
3. F3 conflicts and change log; F4 chat/email capture.
4. F5 impact analysis; F6 options and demand slider.
5. F7 decision package and "input changed" alert; persona switch for the manager.
6. F8 onboarding with live definitions; F2 connections and Excel add-in view.
7. F9 scripted assistant.
8. Guided tour, reset, polish, accessibility pass.
9. Deploy and write README.

Commit after each step with a clear message.
