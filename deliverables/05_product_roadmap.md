# Product Roadmap: eVcN

*Translating the eVcN vision into a sequenced, outcome-driven plan. It tells riders, owners, partners, and engineers what we're building, why, and roughly when — and, just as importantly, what we are **not** building yet.*

## Vision
> **Make charging an electric motorcycle in Vietnam as effortless and reliable as filling a petrol tank used to be — one trusted assistant that always finds you an available charger and holds it for you.**

## Strategy
We win not by being the biggest map, but by being the most **trustworthy single answer**.
*   **Mobile-first, conversation-first:** riders describe a need in one sentence; we return one confident recommendation, not a wall of options.
*   **Availability is the product:** real-time, honored reservations are our moat — accuracy beats coverage.
*   **Two-sided flywheel:** we monetize and delight owners (dashboard, insights, uptime) so they keep ports free, which delights riders, who drive volume back to owners.
*   **Cheap-AI-by-default:** ship the consultant on a deterministic rule engine first (near-zero per-query cost), and add LLM intelligence only where it measurably raises trust/coverage.
*   **What we will NOT do (yet):** build our own charging hardware, expand outside HCMC before liquidity, or replace the rule engine with an LLM before live data is solid.

## Capabilities (Themes)
Grouped into value-delivering epics rather than a feature laundry list:
1.  **Trusted Discovery & Reservation** — Copilot recommendations, filters, map, port-hold reservations, transparent cost/time estimates. *(POC proves the UX; productionize with live data.)*
2.  **Live Network Truth** — OCPP/partner integration for real-time port status, fault detection, and reservation accuracy.
3.  **Payments & Identity** — MoMo/ZaloPay/VNPay, saved rider profile & motorcycle, booking history.
4.  **Owner Operations SaaS** — dashboard (utilization, revenue, faults), real-time fault alerts, AI suggestions, pricing controls.
5.  **Intelligent Copilot** — LLM upgrade with structured output, validation, streaming, multilingual (VI/EN) NLU; rule engine as fallback.
6.  **Demand Shaping & Growth** — dynamic/off-peak pricing, predictive availability, referrals, fleet (delivery/ride-hailing) accounts.

## Success Metrics (HEART)
| Dimension | Metric | Target signal |
|---|---|---|
| **Happiness** | Recommendation trust / CSAT after a charge | ≥ 4.3 / 5 |
| **Engagement** | Charges (reservations) per active rider / week | ≥ 3 |
| **Adoption** | New riders completing first reservation | ≥ 60% of activations |
| **Retention** | Week-4 rider retention | ≥ 40% |
| **Task Success** | Find → reserve completion rate; reservation-honored rate | ≥ 85% complete; ≥ 95% honored |
| **Owner outcome** | Network utilization ↑, fault time-to-detect ↓ | +10pts util; alert < 5 min |

*Guardrail metric:* **availability accuracy** (shown-available that's actually chargeable) — the number that protects trust above all.

## Time Horizon (Now / Next / Later)
**🟢 Now (0–3 months) — make the POC real and trustworthy**
*   Backend + auth; replace `localStorage`; real reservations with port-hold/expiry.
*   Live availability for a beachhead set of HCMC stations (OCPP/partner) — start where we have owner buy-in.
*   Payments (MoMo/ZaloPay) and saved rider profile/motorcycle.
*   Real map/distance; keep the **rule-based Copilot**, add light VI/EN NLU.
*   *Outcome:* a rider can find, reserve, pay, and charge for real in their district.

**🟡 Next (3–9 months) — intelligence & the owner business**
*   **Owner SaaS dashboard** with real-time fault alerts and AI insights; subscription billing.
*   **LLM Copilot** (structured output + validation + streaming, rule fallback) for fuzzier, multilingual queries.
*   Dynamic/off-peak pricing nudges; route-aware "charge along the way."
*   *Outcome:* owners pay for visibility; riders get smarter, language-flexible help.

**🔵 Later (9–18 months) — scale the flywheel**
*   Predictive availability ("usually free at 2pm"); fleet/delivery (Grab/Ahamove/Be) accounts.
*   Battery-swap network integration (Selex/Dat Bike) as an option alongside charging.
*   Expansion to Hanoi/Da Nang once per-district liquidity is proven; partner marketplace & open API.
*   *Outcome:* a national, defensible network with a data moat.
