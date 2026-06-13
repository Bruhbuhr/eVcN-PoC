# Prototype Plan: eVcN

*Directs the design/prototype phase. The eVcN POC in this repo (`eVcN-PoC/`) is the prototype — a high-fidelity, clickable React app that simulates the full experience on faked data so we can test the concept with riders and owners before building live infrastructure.*

## User Flow Diagram
The **happy path** the prototype must demonstrate (this is the built-in "Demo script" in `App.jsx`):

```
Driver App  →  AI Assistant  →  Recommendation  →  Booking Modal  →  Confirmation  →  Dashboard / Bookings
  (browse)       (ask)            (one pick)         (details)         (Booking ID)      (reflects update)
```

```mermaid
flowchart TD
    A[Open Driver App] --> B{How to find a charger?}
    B -->|Browse + filter| C[Station cards: Fast / Cheapest / Available / Closest]
    B -->|Ask Copilot| D[AI Assistant: &quot;charge near District 1 before 6pm&quot;]
    D --> E[eVcN Copilot detects intent + picks 1 station]
    E --> F[Recommendation card: reason, duration, cost, kWh, ports]
    C --> G[Tap 'Reserve Charger']
    F -->|Reserve recommended| G
    G --> H[Booking Modal: motorcycle, name, phone, time, current/target battery]
    H --> I[Live estimate recomputes: kWh, duration, cost]
    I --> J{Valid input?}
    J -->|No| H
    J -->|Yes| K[Confirm booking → Booking ID]
    K --> L[Bookings view shows reservation]
    K --> M[Station Dashboard: revenue + charger status update]
```

*   **Why it matters:** the experience is a *sequence*, not a single screen. The flow ensures error states (invalid phone, target ≤ current battery, closed/full station disabling Reserve) and the confirmation are not skipped.
*   **Screens to mock (all built):** Driver App (hero + map + filters + station cards), AI Assistant (chat + example prompts + recommendation card), Booking Modal (form + live estimate + success state), Station Dashboard (metrics + revenue/utilization charts + charger table + AI insights), Bookings table.

## Frontend (FE) Prototype Focus
*   **Level of fidelity:** **High.** Production-grade React + Vite + Tailwind UI, with Recharts data viz, lucide-react icons, responsive layout, and accessibility built in (focus-trapped modal, `aria` labels, keyboard nav, `aria-live` typing indicator). This is deliberately high-fidelity because we're testing *trust and clarity*, which low-fi wireframes can't surface.
*   **Key interactions to feel real:**
    *   **Conversational ask → single answer:** typing or tapping an example prompt triggers a ~650 ms simulated "eVcN Copilot is thinking…" indicator, then a recommendation card with a *reason* and a **Reserve recommended charger** button.
    *   **Filters & map:** toggling Fast / Cheapest / Available now / Closest re-sorts/filters station cards instantly; HCMC map shows open (green) vs. closed (slate) pins by district.
    *   **Live estimate:** in the booking modal, changing current/target battery or station instantly recomputes kWh needed, charge duration, and VND cost — so the number feels responsive and honest.
    *   **State that persists & propagates:** confirming a booking decrements available ports, flips a charger to "Reserved," and makes the booking appear in both **Bookings** and the **Dashboard** revenue — demonstrating the two-sided flywheel in one browser.
    *   **Owner insights:** asking "show station owner insights" switches the Copilot to SaaS-style operational tips (no driver reservation offered).
*   **Faked backend (intentionally hardcoded for the test):**
    *   **No real AI** — `eVcN Copilot` is a **rule-based intent classifier** (`src/lib/assistant.js`), not an LLM. Recommendations are deterministic.
    *   **Mock data** — 5 HCMC stations + 20 chargers + sample bookings/sessions/revenue (`src/data/mockData.js`); the map uses mock `mapPosition` percentages, not real geo.
    *   **Transparent estimate model** — `estimateCharging` in `src/lib/booking.js` (4 kWh battery; Standard 1.5 / Fast 3.5 / Ultra-fast 6 kW; price × kWh in VND).
    *   **Persistence** — `localStorage` only (best-effort), versioned; no server, payments, navigation, or auth.
*   **Impact:** the prototype is scoped to the **minimum experience needed to gather feedback** on the two riskiest assumptions — *do riders trust one recommendation enough to reserve?* and *is the owner dashboard actionable?* — without over-engineering live OCPP/payment infrastructure that the [PRD](06_prd.md) defers to V1 build.

## How to run the prototype
```bash
cd eVcN-PoC
npm install
npm run dev      # open the local Vite URL
npm test         # Vitest unit tests (assistant, booking, mockData, App)
```
**Suggested test script:** Driver App → ask *"I need to charge near District 1 before 6pm"* → Reserve the recommended charger → enter motorcycle + battery details → Confirm → open Station Dashboard and show the booking + revenue updated.
