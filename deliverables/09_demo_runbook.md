# 09 — Tech59 Demo Runbook

Owner-forward run-of-show and talk track for the eVcN presentation. The frame is **"four weeks ago I had an idea — here's what I built, and why."** It pairs a live demo with the product-thinking evidence in deliverables 01–08, so the audience sees both an engineer *and* a product thinker.

Target length: **8–10 minutes** (≈3 min story, ≈5 min demo, ≈1–2 min "what's next / what I'd validate").

---

## 0. Before you start (setup checklist)
- [ ] `npm run dev` running; browser at the dev URL, zoomed so the owner console is legible on the projector.
- [ ] Logged out, or clear `localStorage` so onboarding is fresh (`evcn-owner-onboarding:*`). The owner account must have `role: owner`.
- [ ] One browser window only — the rider/owner switch is in the top bar; no tab juggling.
- [ ] Have the talking points below on a second screen / phone.

---

## 1. The idea (≈1 min) — *why this exists*
- HCMC runs on electric motorbikes, but riders lack a **trustworthy** way to find an available charger that fits the moment (nearest / cheapest / fastest / open now / before a deadline / to a target %) and **hold it** before arriving.
- Small charger owners lack **operational visibility** — they learn a charger is down from a complaint, not a dashboard.
- Source evidence: [01 Design Thinking](01_design_thinking_doc.md), [02 Personas](02_persona.md) (rider "Commuter Linh", owner "Operator Tuan").

## 2. The insight (≈1 min) — *why a two-sided product*
- One trusted recommendation beats a list of ten. But a recommendation is only trustworthy if availability is **real**.
- That makes it a flywheel: **owners keep the network truthful → riders trust it → more bookings → owners get value → more owners join.**
- This demo leads with the **owner console** because that's where the trustworthy-supply side is won. (Scoping decision, June 18.)

## 3. The build — live demo (≈5 min)

> The whole demo is one browser. Owner change → rider sees it. Rider booking → owner revenue moves.

| # | Action | What to say |
|---|--------|-------------|
| 1 | Sign in as owner → **register a station live** (name → charger type → count + price → **Go live**) | "An owner onboards in under a minute. This isn't a mockup — it creates a real station and its chargers in app state." |
| 2 | New station appears in **Station Controls**, the **utilization** chart, and the **Charger Status** table | "Everything downstream updates from one source of truth — chargers drive the port counts." |
| 3 | Toggle the station **Open/Closed**, edit **price/kWh**, mark a charger **Faulty** | "This is a control panel, not a report. Each action is an operator decision." |
| 4 | Switch to **Rider App** (top bar) → Home + Map | "Same browser. The station the owner just created — and the ones still open — are what riders see." |
| 5 | Open **Copilot**, ask e.g. *"charge near District 1 before 6pm"* → **Reserve** the recommendation | "Rule-based today, deliberately — deterministic and trustworthy for V1. One answer, transparent cost and time." |
| 6 | Switch back to **Owner Console** | "**Revenue Today** and the revenue chart just moved — that booking flowed straight back to the owner. That's the flywheel in 20 seconds." |
| 7 | End on the **AI Insights** panel | "Data-driven, not hand-wavy: busiest site, faults, the 5–8pm peak — the start of the owner's reason to pay." |

**If something breaks:** narrate it as a PoC boundary, not a failure — "this is mock data and localStorage by design; the next slide is exactly what becomes real."

## 4. Why it's a product, not a school project (≈1 min)
- "AI can generate an onboarding flow. It can't tell me what owners actually want — that comes from talking to them." → [10 Owner Interview Guide](10_owner_interview_guide.md).
- "And a charging network lives or dies on regulation and trust." → [11 VN Regulation Brief](11_vn_regulation_brief.md).
- The roadmap is sequenced to **de-risk the riskiest assumption first** (live availability + owner buy-in), not to build everything. → [05 Roadmap](05_product_roadmap.md).

## 5. What's next / what I'd validate (≈1 min)
- **NOW:** real backend + auth, replace localStorage, live availability for a beachhead district, payments (MoMo/ZaloPay). (See [05](05_product_roadmap.md) Now/Next/Later.)
- **Evidence I still need:** will owners share live port status? will riders pre-pay to hold a port? (See [04 DVF](04_dvf.md) assumptions.)
- **Guardrail:** shown-available must equal actually-chargeable ≥ 95%.

---

## Anticipated judge questions (prep)
- **"Why not just use Google Maps / the charger brand's app?"** → One trusted answer + a held port + owner ops in one place; brand apps don't aggregate or guarantee.
- **"Why rule-based, not an LLM?"** → V1 trust + zero per-query cost + determinism; LLM is the NEXT horizon once live data is solid ([05](05_product_roadmap.md)).
- **"Who pays?"** → Riders for reliability/holds; owners subscribe for visibility. ([04 DVF](04_dvf.md) viability.)
- **"What about Grab / Be / Xanh SM?"** → Partner/fleet accounts are a LATER-horizon flywheel extension, and a regulatory question ([11](11_vn_regulation_brief.md)).
- **"What's actually real vs mocked?"** → Real: all interactions, state sync, estimates, onboarding-creates-a-station. Mocked: backend, payments, live OCPP, LLM. By design.
