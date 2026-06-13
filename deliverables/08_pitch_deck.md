# Pitch Deck Outline: eVcN

## Presenting
**Presenter:** Founder / Product Lead, eVcN.
**The Hook:** "Ho Chi Minh City moves on roughly 7 million motorbikes — and they're going electric fast. But an electric motorbike battery holds only ~4 kWh, so riders charge 3–5 times a week, and most can't charge at home. Today they just *guess* which station is free… and half the time they guess wrong."

## Problem Statement
Electric-motorbike riders waste time and nerves hunting for a charger that's actually available, fast or cheap enough, and not closed or broken — then arrive to find every port taken. Meanwhile the small owners who run those chargers are flying blind: they don't know their utilization, when a charger died, or what they earned today. Both sides lose — riders slide back into petrol-style anxiety, and owners quietly leak revenue from idle or dead ports.

## Solutions
**eVcN — a two-sided AI charging network.** Riders chat with **eVcN Copilot**: it turns a one-line need ("charge near District 1 before 6pm") into a single trusted recommendation with cost and time up front — and when the ask is vague, it asks one quick question instead of guessing — then **holds a port** before they arrive. Owners get a live **console** to open/close stations, fix faults, reprice, and add chargers, and **every change instantly updates what riders see and book.**
*Demo GIF:* ask → (clarify) → recommend → reserve → confirm → owner closes a station → it disappears for riders in real time.

## Desirability
The pain is **frequent** (3–5 charges/week) and **emotional** (range anxiety + wasted trips), and apartment fire-safety rules make public charging non-optional — so behavior change is realistic. Riders don't want another map; they want **one answer they can trust** and a guaranteed port. (Pulled from the [Persona](02_persona.md) and [DVF](04_dvf.md): the key risk we test in prototype sessions is whether riders trust a *single* recommendation enough to reserve.) Owners, in turn, finally get the "am I making money / is my gear up?" answer they lack today.

## Viability
Two-sided, multi-stream revenue: a per-charge / reservation fee, an **owner SaaS subscription** (owners are the paying buyer — they're judged on uptime and revenue), a premium rider tier, sponsored placement, and B2B **fleet accounts** (Grab / Ahamove / Be). The moat is a **data flywheel** — every honored reservation improves rider trust *and* owner utilization, which a plain map app can't replicate. Because the Copilot is rule-based, **AI cost per query stays near zero**, protecting margins. (See [DVF](04_dvf.md) + [Roadmap](05_product_roadmap.md).)

## Feasibility
The hard, differentiating parts are **already built and demonstrated** in a working POC: a conversational rule-based Copilot (no LLM cost) and a fully interactive owner console whose edits propagate to riders through shared state. To go live we integrate **off-the-shelf** pieces — **OCPP / partner APIs** for real-time port status (the key dependency), **MoMo / ZaloPay / VNPay** for payments, and **Google Maps / Mapbox** for routing. The LLM upgrade (structured output + validation, with the rule engine as a fallback) is a *later enhancement, not a dependency*. We can ship a real beachhead-district MVP without inventing new AI. (See [PRD](06_prd.md) + [DVF](04_dvf.md).)
