# Product Requirements Document (PRD): eVcN V1 — Conversational Copilot, Reservation & Owner Console

*The contract between Product, Design, and Engineering for eVcN's first shippable release. It turns the POC experience into a real, reservable, payable product for HCMC riders, and gives station owners an interactive console to keep those ports available.*

## Objective
Ship a mobile-first, two-sided product that (1) lets an HCMC electric-motorcycle rider **describe a charging need in natural language — answering a quick clarifying question when the ask is vague — receive one trustworthy recommendation with a transparent cost/time estimate, and reserve a real, held charging port before arriving**, and (2) lets a station owner **manage their network (availability, faults, pricing, chargers) from a console whose changes reach riders live** — all backed by live station availability and in-app payment.

## Target Audience
*   **Primary:** "**Commuter Linh**" — HCMC e-motorbike riders (commuters, students, delivery drivers) who charge 3–5×/week and often can't charge at home. (See [Persona](02_persona.md).)
*   **Secondary (now interactive):** "**Operator Tuan**" — small station owners who **manage** stations, chargers, and pricing and read utilization/revenue/fault insights from the console. *Automated/dynamic pricing and multi-owner roles remain out of scope for V1.*

## Value Proposition
Replaces anxious, multi-station guesswork with **one confident answer + a guaranteed port**. A rider goes from "where do I charge?" to a held reservation — with the cost and charge time known up front — in under a minute, removing range anxiety and wasted trips.

## User Stories / Requirements
**Discovery & recommendation**
*   *As a rider,* I want to ask in plain language ("charge near District 1 before 6pm", "cheapest charger", "charge to 80% in under 45 min") so that I get one best station without comparing many.
*   *As a rider,* when my request is vague ("I need to charge"), I want the Copilot to ask **one quick follow-up** (with tappable options) and **remember my answer** so that I'm guided to a good pick instead of getting a canned guess.
*   *As a rider,* I want to see **why** a station was recommended (closest / cheapest / fastest / open now / fits my time/target) so that I trust the suggestion.
*   *As a rider,* I want to filter stations by **Fast / Cheapest / Available now / Closest** and see distance, type, ports, wait, price, and rating so that I can verify the pick myself.
*   *As a rider,* I want a **live estimate** (kWh needed, duration, cost in VND) based on my current → target battery and the charger speed so that there are no surprises.

**Reservation & payment**
*   *As a rider,* I want to reserve a port by entering my motorcycle model, name, phone, preferred time, and battery levels so that a charger is held for me.
*   *As a rider,* I want validation that catches bad input (missing fields, invalid phone, target ≤ current battery) so that I don't submit a broken booking.
*   *As a rider,* I want to pay/hold via MoMo/ZaloPay and get a **booking confirmation with an ID** so that I know it's secured.
*   *As a rider,* I want my confirmed bookings in a **Bookings** view so that I can see history and status.

**Owner operations (interactive)**
*   *As an owner,* I want a dashboard of total/available chargers, active sessions, revenue today, utilization, and fault alerts so that I can monitor my stations.
*   *As an owner,* I want to **open or close a station** so that riders stop being routed to it when it's unavailable.
*   *As an owner,* I want to **mark a charger faulty (or fixed/free it)** so that availability and my fault count reflect reality.
*   *As an owner,* I want to **edit a station's price per kWh** so that I can respond to demand, and have riders see the new price.
*   *As an owner,* I want to **add or remove chargers** so that my port counts stay accurate.
*   *As an owner,* I want every change to **propagate immediately** to what riders see and book and to the Copilot's recommendations, so that the network is never misleading.
*   *As an owner,* I want **data-driven insights** (busiest site, active faults, peak window, closures) so that I know what to act on.

**Quality / trust requirements**
*   The recommendation must use **live availability**; a station shown "Available" must be chargeable (guardrail: availability accuracy ≥ 95%).
*   A held reservation must expire and release the port after a defined window if unused.

## Scope
*   **In Scope (V1):**
    *   **Conversational** rule-based **eVcN Copilot**: clear intents (nearest, cheapest, fastest, available-now, before-time, target-battery) answer instantly; vague requests get one clarifying follow-up with quick replies + slot memory; owner-insight + typo-tolerant greeting handling; light VI/EN place-name handling.
    *   Station list + filters + HCMC map; station detail and transparent estimate.
    *   Real reservation with port-hold/expiry; booking confirmation + Bookings history.
    *   Live availability for a beachhead set of HCMC stations (OCPP/partner).
    *   Payment hold/charge via MoMo or ZaloPay; rider auth + saved profile/motorcycle.
    *   **Interactive owner console:** open/close stations, mark chargers faulty/fixed/free, edit price per kWh, add/remove chargers; utilization/revenue/fault metrics; **data-driven** insights — all propagating live to riders + Copilot.
*   **Out of Scope (deferred to V2+):**
    *   LLM-based Copilot (V1 stays rule-based; LLM is a Next-horizon enhancement).
    *   **Automated/dynamic** pricing, staffing tools, and multi-owner roles/permissions (V1 owner actions are manual + single-operator).
    *   Route-aware charging, predictive availability, battery-swap integration.
    *   Fleet/B2B accounts; multi-city expansion; full multilingual conversational support.

## Dependencies & Assumptions
*   **Technical dependencies:**
    *   **Live availability** via OCPP or charger-partner APIs (highest-risk dependency; blocks the accuracy guarantee).
    *   **Payments:** MoMo/ZaloPay/VNPay integration and settlement.
    *   **Maps/routing:** Google Maps or Mapbox for real distance (replaces mock `mapPosition`).
    *   **Backend + datastore + auth** (replaces `localStorage` persistence in the POC).
*   **Business assumptions:**
    *   Enough beachhead-district owners will share **live port status** to make availability trustworthy.
    *   Riders are willing to pre-pay/hold for a guaranteed port.
    *   The deterministic rule engine is sufficient for V1 trust and coverage (validated in user testing) — deferring LLM cost/complexity.
*   **Impact:** these gate the launch; OCPP integration and owner onboarding must start in parallel with app build, and payment + PII handling triggers security review.
