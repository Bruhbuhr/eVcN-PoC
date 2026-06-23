# eVcN — Product Design Deliverables

Design-thinking and product artifacts for **eVcN**, an AI-assisted electric-motorcycle charging network for Ho Chi Minh City. Each document fills the corresponding workshop template (`../../templates/`) and is grounded in the actual POC code in this repo (`eVcN-PoC/`).

## The product in one paragraph
eVcN is a two-sided platform. **Riders** chat with **eVcN Copilot** — a *conversational* rule-based assistant that asks a clarifying follow-up (with one-tap quick replies) when a request is vague, **remembers** the answers across turns, and returns one trustworthy recommendation with a transparent cost/time estimate, then lets them **reserve a port** before arriving (clear requests still answer instantly). **Station owners** don't just watch a dashboard — they **run the network** from an interactive console: open/close stations, mark chargers faulty/fixed, edit price per kWh, and add/remove chargers, alongside **data-driven** AI insights. Every owner edit **propagates live** to what riders see and book and to the Copilot's recommendations. The POC is high-fidelity React (Vite + Tailwind + Recharts) on mock data (5 HCMC stations, 20 chargers) with `localStorage` persistence and no real LLM/backend yet — by design.

## Documents
| # | Document | Purpose |
|---|---|---|
| 01 | [Design Thinking](01_design_thinking_doc.md) | Empathize → Define → Ideate → Prototype → Test |
| 02 | [Personas](02_persona.md) | Primary rider "Commuter Linh" + secondary owner "Operator Tuan" |
| 03 | [Journey Map](03_journey_map.md) | Discover → Aware → Convert → Retain → Advocate (rider) |
| 04 | [DVF](04_dvf.md) | Desirability, Viability, Feasibility reality check |
| 05 | [Product Roadmap](05_product_roadmap.md) | Vision, Strategy, Themes, HEART metrics, Now/Next/Later |
| 06 | [PRD](06_prd.md) | V1: conversational Copilot, reservation + interactive owner console |
| 07 | [Prototype Plan](07_prototype.md) | User flow + FE prototype focus (the POC itself) |
| 08 | [Pitch Deck](08_pitch_deck.md) | Hook → Problem → Solution → Desirability/Viability/Feasibility |
| 09 | [Demo Runbook](09_demo_runbook.md) | Tech59 owner-forward run-of-show + talk track ("idea → built → why") |
| 10 | [Owner Interview Guide](10_owner_interview_guide.md) | Screener + questions for 5–10 HCMC owners; tests the [04 DVF](04_dvf.md) assumptions |
| 11 | [VN Regulation Brief](11_vn_regulation_brief.md) | Research scaffold: standards, licensing, electricity-pricing — leads marked to verify |

## Key source references
- `src/lib/assistant.js` — conversational eVcN Copilot (`converse` + slot memory, intent detection, typo-tolerant greeting, recommendation) and data-driven `buildOwnerInsights`
- `src/lib/booking.js` — charging/cost estimate, reservation, `localStorage` persistence, plus `syncStationPorts` + `createCharger` for owner actions
- `src/data/mockData.js` — 5 HCMC stations, 20 chargers, bookings, sessions, revenue
- `src/App.jsx` — Driver App, conversational AI Assistant (quick-reply chips), **interactive** Station Dashboard (owner console), Bookings, Booking modal
- `PLAN.md` — the build plan behind the conversational-assistant and interactive-dashboard work
