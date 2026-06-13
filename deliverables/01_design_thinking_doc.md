# Design Thinking Document: eVcN

*Product: **eVcN** — an AI-assisted charging network for electric motorcycle riders in Ho Chi Minh City (HCMC). This document is the foundational step: it anchors eVcN in a real human problem (range anxiety + finding an available charger) rather than in a feature list.*

## Empathize
*   **Who they are:** Two groups. (1) **Riders** — commuters, students, and delivery drivers in HCMC who have switched (or are switching) from petrol scooters to electric motorbikes (VinFast Feliz/Klara/Evo, Dat Bike Weaver, Selex Camel, Yadea). (2) **Station owners** — small operators who run a handful of chargers at a parking lot, café, or shopfront as a side revenue stream.
*   **Their environment:** Dense, hot, fast-moving traffic. A motorcycle battery is small (~4 kWh in the mock model, ≈70–100 km of range), so charging is a frequent, recurring event, not a once-a-week ritual. Many riders live in apartments where overnight in-unit charging is restricted or banned for fire-safety reasons, so they *depend* on public/semi-public chargers.
*   **What they feel:** Riders feel **range anxiety** ("will I make it?"), **decision fatigue** (which of several stations — by distance, price, speed, wait?), and **fear of a wasted trip** (arriving to find every port full, the station closed, or a charger faulty). Owners feel **blind** — they don't know their utilization, when a charger went down, or how much they actually earned today.
*   **Current workarounds:** Riders guess from memory, charge opportunistically wherever they happen to be, top up at home when they can, or keep the tank "petrol-style" topped to avoid risk. Owners eyeball the lot and find out about a dead charger only when a customer complains.

**Emotional target:** turn an anxious, multi-tab comparison into one calm, confident "go here, it'll cost ~X and take ~Y minutes, and I've held a port for you."

## Define
**Problem statement:**
> *Electric-motorcycle riders in Ho Chi Minh City lack a fast, trustworthy way to find an available charger that fits their immediate need — nearest, cheapest, fastest, open now, before a deadline, or to a target battery % — and to secure it before they arrive; meanwhile the small owners who run those chargers lack the operational visibility (availability, utilization, faults, revenue) to keep ports free and profitable.*

This is the North Star. Every feature is judged by whether it makes a rider's *next charge* easier, or makes an owner's *network* more available and profitable.

## Ideate
Brainstormed solution space (wild → practical):
*   A map-only station finder with live pins.
*   A price-comparison table across stations.
*   A battery-swap aggregator (Selex/Dat Bike style).
*   **A conversational "charging consultant" that converts a vague, natural-language need into one best recommendation.**
*   Pre-arrival **reservation** so a port is guaranteed.
*   A live **charging-cost & duration estimator** before you commit.
*   **An owner dashboard** with utilization, faults, and revenue, plus AI suggestions.
*   Dynamic / off-peak pricing nudges.
*   Predictive availability ("this hub is usually free at 2pm").
*   Route-aware charging along a planned trip.

**Winning bets (innovation × feasibility):**
1.  **eVcN Copilot** — a consultant-style assistant that takes one sentence ("charge near District 1 before 6pm") and returns a single confident pick + estimate + the option to reserve. This is the desirability differentiator.
2.  **A two-sided platform** — pairing the rider app with an owner dashboard, so improving availability for riders is the same act that improves revenue for owners (the flywheel).

## Prototype
The artifact built to test these bets is the **eVcN React POC** in this repo (`eVcN-PoC/`):
*   A high-fidelity, clickable web app with four views: **Driver App**, **AI Assistant**, **Station Dashboard**, **Bookings**.
*   **eVcN Copilot** runs as a *conversational rule-based mock AI* (`src/lib/assistant.js`): when a request is vague it asks **one clarifying follow-up** (with quick-reply chips), **remembers** the answers across turns, and only then recommends — while clear requests (nearest, cheapest, fastest, available-now, before-time, target-battery) still answer immediately. It also handles owner-insight questions and typo-tolerant greetings, then recommends one station and explains why.
*   A **reservation flow** (`BookingModal`) with a live charging estimate (kWh needed, duration, cost) computed from a transparent model (`src/lib/booking.js`).
*   An **interactive owner console** (Station Dashboard): the owner can open/close stations, mark chargers faulty/fixed, edit price per kWh, and add/remove chargers, alongside revenue/utilization/fault metrics and **data-driven** AI insights. Every owner edit **propagates live** to the rider Driver App, the booking estimate, and the Copilot's recommendations.
*   **Faked backend:** 5 mock HCMC stations + 20 chargers (`src/data/mockData.js`), `localStorage` persistence, and a short simulated "thinking" delay (~400 ms to ask, ~700 ms to recommend). No live data, payments, navigation, or real LLM — by design, to test the *experience* before building expensive infrastructure.
*   **Core flow demonstrated:** ask Copilot → *clarify if vague* → get one recommendation → reserve → enter motorcycle + battery details → confirm → see the booking and revenue update on the owner console — then, as an owner, close a station or fault a charger and watch it change what riders can book.

## Test
*   **Who we'll test with:** 6–10 HCMC e-motorbike riders (a mix of commuter, student, and delivery profiles) and 2–3 small station owners.
*   **What we're seeking:**
    *   *Riders:* Does a single recommendation feel **trustworthy** (vs. wanting a full list)? Do they understand the cost/time estimate? Would they actually reserve before arriving? Does the Copilot understand their phrasing (incl. Vietnamese place names like "District 1")?
    *   *Owners:* The console is now **actionable** — are open/close, fault/fix, repricing, and add/remove the right controls? Do they trust that an edit instantly reaches riders? What single metric do they check first?
*   **How we measure success/failure:** task completion (find + reserve in under ~60s), a trust/confidence rating on the recommendation, stated willingness to pay (riders) or subscribe (owners), and qualitative "would use daily." Failure signals: users re-open the full list instead of trusting the pick; confusion at the estimate; owners shrug at the dashboard.
*   **Impact:** results feed directly back into the [PRD](06_prd.md) (which intents/fields to keep), the [Roadmap](05_product_roadmap.md) (rule-based → LLM, and live-data priority), and the [DVF](04_dvf.md) viability case.
