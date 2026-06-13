# DVF Framework: eVcN

*A reality check on eVcN: is an AI-assisted e-motorbike charging network **Desirable** to riders & owners, **Viable** as a business, and **Feasible** to build? eVcN must sit at the intersection of all three.*

## Desirable (for users)
**Yes — for both sides of the market.**
*   **Riders:** HCMC runs on motorbikes, and electrification is accelerating (VinFast Feliz/Klara/Evo, Dat Bike, Selex, Yadea). A small ~4 kWh battery means riders charge 3–5× a week, and many live in apartments where in-unit charging is restricted, so they *depend* on public chargers. The acute, recurring pain is not "find a station on a map" — it's **"find one that's actually free, fast/cheap enough, and hold it before I ride over."** The POC's single-answer Copilot ("charge near District 1 before 6pm" → one pick + estimate + reserve) directly removes the comparison and the wasted-trip risk. The pain is frequent and emotional enough to change behavior.
*   **Owners:** Small operators are flying blind on utilization (mock network shows 42–92%), faults, and revenue. A dashboard that says "you're at 86% — add 2 chargers" or "a faulty unit is costing ~18% today" is a painkiller for their core anxiety: *am I making money and is my equipment up?* The interactive prototype goes a step further — the owner can **act** on those signals in one click (open/close, fix a fault, reprice, add a charger) and instantly see it ripple to riders, making the value tangible rather than passive.
*   **Evidence to gather (Test stage):** task-completion + trust ratings on the single recommendation, willingness-to-reserve, and owners' "would check daily." This is the main risk to de-risk in user testing.
*   **Impact:** strong path to Product–Market Fit on the demand side, with a built-in supply-side hook.

## Viable (for businesses)
**Yes — a two-sided model with multiple, reinforcing revenue streams.**
*   **Revenue model:**
    *   **Transaction / reservation fee** — a small margin on each charge or a fee per held reservation.
    *   **Owner SaaS subscription** — tiered access to the dashboard, alerts, and AI insights (the owner is the *paying buyer*, much like school districts in the LMS example: they're evaluated on uptime and revenue).
    *   **Sponsored placement & dynamic-pricing share** — promoted stations and a cut of off-peak demand-shaping.
    *   **Premium rider tier** — guaranteed reservations, priority support, route-aware charging.
    *   **B2B fleet accounts** — delivery/ride-hailing fleets (Grab, Ahamove, Be) charging at volume.
*   **Strategic fit & moat:** every honored reservation improves rider trust *and* owner utilization — a data flywheel (real-time availability + demand patterns) that a plain map app can't copy. Liquidity (enough stations + riders per district) is the moat and the chicken-and-egg risk.
*   **Unit economics to validate:** CAC via rider communities/referrals and dealership partnerships should be low; LTV is high given 3–5 charges/week. The model must keep **AI cost per query** near-zero — which the current rule-based Copilot already does (see Feasible).
*   **Impact:** a fundable, sustainable business with owners subsidizing the network while riders drive volume.

## Feasible (for engineers)
**Yes — with honest staging from "mock" to "real."** The POC deliberately fakes the hard parts; here's the real-build reality.
*   **Already feasible today (in the POC):** the recommendation engine is a deterministic, **conversational rule-based engine** (`src/lib/assistant.js`) — multi-turn clarifying, slot memory, typo-tolerant greetings, and data-driven owner insights — plus a transparent charging/cost model (`src/lib/booking.js`) and a fully **interactive owner console** whose edits propagate to riders through shared state (`syncStationPorts`). This means the core two-sided experience needs **no LLM and no per-query AI cost** to ship — a major feasibility advantage.
*   **What V1 production requires:**
    *   **Live availability** — integrate charger hardware via **OCPP** (or partner APIs) for real-time port status; this is the single highest-effort, highest-value dependency.
    *   **Real reservations** — a backend with a port-hold/expiry mechanism and conflict handling.
    *   **Payments** — MoMo / ZaloPay / VNPay integration for holds and charging.
    *   **Maps & routing** — Google Maps / Mapbox for real distance and navigation (POC uses mock `mapPosition` coordinates).
    *   **Persistence** — move from `localStorage` to a real datastore + auth.
*   **AI enhancement (Next, not a blocker):** upgrade the Copilot from rules to an **LLM with structured output + schema validation, streaming, and a rule-based fallback** (per AI-product best practice — never trust raw LLM output, separate user input from system prompt, cap cost, handle provider failure). The existing rule engine becomes the circuit-breaker fallback.
*   **Constraints/risks:** dependence on **third-party charger hardware & owners** to share live status; Vietnamese-language NLU (place names like "Quận 1"/"District 1"); EV-charging standards and fire-safety regulation; data accuracy SLAs (stale availability destroys trust). Real-money payments raise security/PII obligations.
*   **Impact:** a realistic, phased architecture — ship the trustworthy experience on rules + live data first, layer the LLM and predictive features once liquidity and data exist.

---

### DVF verdict

| Lens | Verdict | Biggest risk to retire |
|---|---|---|
| **Desirable** | ✅ Strong (riders) + ✅ (owners) | Will riders trust a *single* recommendation enough to reserve? |
| **Viable** | ✅ Two-sided, multi-stream | Two-sided liquidity (chicken-and-egg per district) |
| **Feasible** | ✅ Staged (rules → live data → LLM) | Live availability via OCPP / owner hardware integration |
