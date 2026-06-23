# 11 — Vietnam EV Charging Regulation Brief (Research Scaffold)

Per the June 18 scoping action item ("research EV charging regulations in Vietnam"). This is a **research scaffold**, not a legal opinion. Its job is to frame the questions eVcN must answer and point at credible sources to check.

> ⚠️ **Every specific claim below is a LEAD, not a confirmed fact.** Items tagged `[verify]` must be checked against the **primary source** (the actual TCVN standard text, the MOIT/MOST circular, or a licensed Vietnamese lawyer) before being stated as true in a pitch or relied on for product decisions. Secondary sources (law-firm blogs, news) are starting points only. Regulations here are moving quickly (multiple changes in 2024–2025), so re-check dates.

## Why regulation matters to eVcN
- A charging network's core promise is **trust and safety**. Judges and partners (Grab/Be/Xanh SM, owners) will ask whether we understand the rules. ([09 Demo Runbook](09_demo_runbook.md) anticipates this question.)
- Two product-relevant unknowns sit directly on the [05 Roadmap](05_product_roadmap.md) NOW horizon: **(a)** what an owner must legally do to operate a charger, and **(b)** how electricity may be **priced/resold** to riders — which constrains the owner console's pricing controls.

## Research questions (the actual brief)

### A. Technical & safety standards for chargers
- A1. What TCVN standards govern EV charging equipment, and which are **mandatory vs voluntary**? `[verify]`
- A2. Is there a **compliance/certification gate** before a charger can be sold or operated, and a date it took effect? `[verify]` — *lead: reporting describes a national technical regulation effective **15 June 2025** requiring new stations to comply before market circulation; confirm scope (excludes wireless / heavy-duty?) against the circular itself.*
- A3. What **fire-prevention and electrical-safety** requirements apply, especially for chargers in **apartment basements / public parking** (a noted risk area)? `[verify]`

### B. Business licensing to operate a station
- B1. What licenses/registrations must a small owner hold to legally run public chargers (business registration, electrical/construction permits, fire-safety approval)? `[verify]`
- B2. Do requirements differ for **private/on-premise** (a café charging its own customers) vs **public/commercial** charging? `[verify]`
- B3. Any **foreign-investment** constraints relevant if eVcN itself operates or aggregates? `[verify]`

### C. Electricity pricing & reselling — *most product-relevant*
- C1. Can an owner legally **resell electricity** to riders at a chosen price per kWh, or is the tariff regulated/capped? `[verify]` — *lead: MOIT has presented a **draft retail electricity pricing scheme for EV charging** (multiple approaches under consideration). Confirm current status — draft vs in force — and whether it caps the owner's price/kWh, which directly limits the console's pricing control.*
- C2. Are there **preferential/subsidized** electricity rates for public charging stations? `[verify]`
- C3. Tax/VAT/invoicing obligations on charging revenue? `[verify]`

### D. Data, payments, identity (cross-checks with other deliverables)
- D1. Payment-handling and PII obligations once we add MoMo/ZaloPay + rider identity. → ties to [04 DVF](04_dvf.md) "security review" feasibility note. `[verify]`
- D2. Any rules on collecting/sharing **real-time station data** that affect the availability feature? `[verify]`

## Source leads to verify against primaries
**Official / primary (preferred):**
- Ministry of Science & Technology (MOST) — TCVN standards & the national technical regulation on EV charging equipment. `[verify primary text]`
- Ministry of Industry & Trade (MOIT) — draft electricity pricing for charging stations. `[verify status]`

**Secondary (starting points only — do not cite as fact):**
- Tilleke & Gibbins — "Vietnam's Legal Framework on Electric Vehicles…": https://www.tilleke.com/insights/vietnams-legal-framework-on-electric-vehicles-offers-new-opportunities-for-investors/
- DEDICA Law — "Legal Framework for EV Charging Stations in Vietnam": https://www.dedica-law.com/en/articles/legal-framework-for-electric-vehicle-charging-stations-in-vietnam-is-it-attractive-enough-to-draw-fdi
- Reccessary — "MOIT presents draft of electricity pricing for charging station": https://www.reccessary.com/en/news/vn-regulation/moit-presents-draft-electricity-pricing-for-charging-station
- GlobalValidity — "Vietnam Releases Technical Regulations on EV Charging": https://globalvalidity.com/vietnam-national-technical-regulations-on-electric-vehicle-charging-stations/
- VnEconomy — "Vietnam announces eleven standards for EV charging stations": https://en.vneconomy.vn/vietnam-announces-eleven-standards-for-electric-vehicle-charging-stations.htm
- Quang Anh — "Legal Procedures for Building EV Charging Stations in Vietnam": https://quanganhcgte.com/en/legal-procedures-for-building-electric-vehicle-charging-stations-in-vietnam/
- US ITA / trade.gov — "Vietnam Electric Vehicle Industry": https://www.trade.gov/market-intelligence/vietnam-electric-vehicle-industry

## How to use this in the pitch
- Don't recite regulations. Say: *"I've mapped the regulatory surface — technical/safety standards (TCVN), licensing, and the open question of electricity-pricing rules — and the pricing rule is the one that constrains our owner console, so it's on the validation list."* That demonstrates product judgment without overclaiming.
- The honest, defensible framing is **"here are the questions and where I'll get answers,"** not a confident legal summary built on secondary sources.

---
*Last researched: 2026-06 (web sources). Treat all specifics as stale until verified against primaries.*
