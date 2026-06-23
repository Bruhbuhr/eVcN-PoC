# 10 — Owner Interview Guide

A structured guide for talking to **5–10 potential station owners** in Ho Chi Minh City, per the June 18 scoping action item. The goal is evidence, not validation theater: we want to find out where eVcN is *wrong*, especially on the two riskiest assumptions in [04 DVF](04_dvf.md).

> Owner persona reference: "Operator Tuan" — small business owner running a handful of chargers as side income. See [02 Personas](02_persona.md).

## What we are trying to learn (assumptions under test)
1. **A1 — Live status sharing:** Will owners actually share real-time port/charger status (the dependency behind the ≥95% availability guardrail)?
2. **A2 — Console value / willingness to pay:** Is operational visibility (utilization, faults, revenue) worth a subscription to them?
3. **A3 — Current pain is real:** Do they actually lose money/time today from poor visibility, faults, and empty/full ports?
4. **A4 — Onboarding fit:** Does "register a station → add chargers → set price → go live" match how they think about their setup?

Each question below maps to an assumption. Keep it conversational — these are prompts, not a script to read verbatim.

## Recruiting screener (qualify before booking time)
- Do you own or operate one or more EV/e-motorbike chargers, or are you actively considering installing some? *(Need: yes to one.)*
- Roughly how many chargers, and where (district)?
- Is charging your main business or a side income alongside something else (café, parking, shop)?
- Who handles the chargers day-to-day — you, staff, or a vendor?
- *(Exclude: large branded networks with their own back-office; we want small/independent owners.)*

## Warm-up (2–3 min)
- Tell me about your chargers — how did you end up running them?
- Walk me through a normal day. When do you even think about the chargers?

## Core questions

### Current reality & pain (A3)
1. Last time a charger had a problem — how did you find out, and how long until you knew? *(Listen for: learned from a complaint.)*
2. How do you know today whether your ports are busy or sitting empty? What do you do with that — if anything?
3. How do you track what the chargers earn? Show me, if you can. *(Ask to see the actual tool/notebook/app.)*
4. What's the most annoying or costly thing about running them?

### Live status sharing (A1) — *the critical one*
5. Imagine an app where riders see, in real time, whether your ports are free — and can reserve one before arriving. What's your first reaction?
6. Would you be willing to connect your chargers so that status is shared automatically? What would make you hesitant? *(Probe: control, privacy, competitors seeing data, effort.)*
7. If a rider reserves a port and doesn't show, what should happen? How long would you hold it?

### Console value & willingness to pay (A2)
8. If you had a dashboard showing utilization, faults the moment they happen, and revenue per station — what would you do differently?
9. Which single piece of that would you actually open every day?
10. Would you pay a monthly fee for it? *(Don't lead with a number — let them anchor, then probe a range.)* What would it need to do to be worth that?

### Onboarding & pricing (A4)
11. If you were setting this up yourself, what would you expect to enter to get a station "live"? *(Compare to: name → chargers → price → go live.)*
12. How do you decide your price per kWh today? Would you change it based on demand if the tool suggested it?

### Growth / partners (exploratory, LATER horizon)
13. Do fleets (Grab, Be, Ahamove, Xanh SM riders) use your chargers? Would guaranteed availability for them interest you?

## Wrap-up
- If this existed today and worked, would you want in? What's the one thing that would stop you?
- Who else running chargers should I talk to? *(Snowball recruiting.)*

## After each interview — capture immediately
- 1–2 sentence summary + the single strongest quote.
- Per assumption A1–A4: **supports / contradicts / unclear**, with the evidence.
- Surprises (things we didn't have a question for).
- Any number they gave (charger count, revenue, price, willingness-to-pay).

## Synthesis (after 5–10)
- Tally A1–A4 across owners. **A1 is the go/no-go** — if owners won't share live status, the availability guarantee (and the whole trust thesis) needs rethinking before we build backend/OCPP work in the [05 Roadmap](05_product_roadmap.md) NOW horizon.
- Feed contradictions back into [04 DVF](04_dvf.md) and the PRD scope.

> Note: target N=5–10 is for **directional signal**, not statistical significance — say so when presenting. Watch for leading questions; we want disconfirmation, not nods.
