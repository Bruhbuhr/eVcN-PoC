# eVcN — Product Design Deliverables

Design-thinking and product artifacts for **eVcN**, an AI-assisted electric-motorcycle charging network for Ho Chi Minh City. Each document fills the corresponding workshop template (`../../templates/`) and is grounded in the actual POC code in this repo (`eVcN-PoC/`).

## The product in one paragraph
eVcN is a two-sided platform. **Riders** describe a charging need in plain language to **eVcN Copilot** (a rule-based assistant covering 8 intents — nearest, cheapest, fastest, available-now, before-time, target-battery, owner-insights, greeting), get one trustworthy recommendation with a transparent cost/time estimate, and **reserve a port** before arriving. **Station owners** monitor utilization, revenue, and faults on a dashboard. The POC is high-fidelity React (Vite + Tailwind + Recharts) on mock data (5 HCMC stations, 20 chargers) with `localStorage` persistence and no real LLM/backend yet — by design.

## Documents
| # | Document | Purpose |
|---|---|---|
| 01 | [Design Thinking](01_design_thinking_doc.md) | Empathize → Define → Ideate → Prototype → Test |
| 02 | [Personas](02_persona.md) | Primary rider "Commuter Linh" + secondary owner "Operator Tuan" |
| 03 | [Journey Map](03_journey_map.md) | Discover → Aware → Convert → Retain → Advocate (rider) |
| 04 | [DVF](04_dvf.md) | Desirability, Viability, Feasibility reality check |
| 05 | [Product Roadmap](05_product_roadmap.md) | Vision, Strategy, Themes, HEART metrics, Now/Next/Later |
| 06 | [PRD](06_prd.md) | V1: Driver Reservation + AI Copilot — scope & requirements |
| 07 | [Prototype Plan](07_prototype.md) | User flow + FE prototype focus (the POC itself) |

> A pitch deck (template 08) was not requested but can be generated from these artifacts on request.

## Key source references
- `src/lib/assistant.js` — rule-based eVcN Copilot (intent detection, recommendation)
- `src/lib/booking.js` — charging/cost estimate model + reservation + persistence
- `src/data/mockData.js` — 5 HCMC stations, 20 chargers, bookings, sessions, revenue/utilization
- `src/App.jsx` — Driver App, AI Assistant, Station Dashboard, Bookings, Booking modal
