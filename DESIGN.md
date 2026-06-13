# DESIGN.md — eVcN UI/UX Redesign Brief (for Google Stitch)

A ready-to-use design brief for **Google Stitch** (Gemini-powered UI generator). It captures what eVcN is, who it's for, a fresh visual language, and **copy-paste prompts for every screen**. Use it to redesign the whole product or one screen at a time.

> eVcN is an AI-assisted **electric-motorcycle charging network for Ho Chi Minh City**. Two sides: **riders** find/compare/reserve a charger and chat with an AI copilot; **station owners** run their network from a dashboard. Currency is **VND**; places are HCMC districts; vehicles are e-motorbikes (VinFast Feliz S / Klara S / Evo200, Dat Bike Weaver/Quantum, Yadea Orla, Selex Camel).

---

## How to use this file with Stitch

1. **Set the theme once:** paste **§2 Global design language** as your first message so every screen shares one look.
2. **Generate screens:** paste each prompt in **§4** (Stitch asks to confirm before multi-screen runs — paste the screen list in §4.0 to do them as a flow).
3. **Refine:** use Stitch's *annotate-to-edit* for targeted tweaks; use *variants* on the hero, station card, and copilot bubble.
4. **Keep it real:** feed the sample data/copy in **§6** so designs don't fill with lorem ipsum.
5. **Export** to HTML/Figma; this app's code is React + Tailwind, so Tailwind-friendly output drops in cleanly.

---

## 1. Users (context for every prompt)

- **Rider — "Commuter Linh," 27, HCMC.** On a phone, one-handed, often in a hurry at ~20% battery. Wants *one* trustworthy answer + a held port. Mobile-first.
- **Owner — "Operator Tuan," 45.** Runs a few chargers as side income; glances at a dashboard a few times a day; not technical. Wants "is my gear up and am I making money?" and one-tap controls. Desktop/tablet.

---

## 2. Global design language — paste this first

```
Design system for "eVcN", an AI electric-motorcycle charging app for Ho Chi Minh City.
Apply this style to every screen.

Brand mood: calm, trustworthy, energetic — "electric calm". Premium fintech-meets-mobility,
not childish, not corporate-stiff. It should feel safe to trust with money and routing.

Color palette:
- Ink / dark surface: #0B1220 (near-black navy) and #0F172A
- Light surface: #F7FAFC and pure #FFFFFF
- Primary "volt" green (energy / available / go): #19E68C
- Electric cyan accent (charging / AI): #38BDF8
- Charge gradient (for active/charging/AI moments): linear from #19E68C to #38BDF8
- Warm amber (wait time / reserved): #F59E0B
- Rose (fault / error / closed-bad): #FB7185
- Neutral slate text: #0F172A on light, #E2E8F0 on dark; muted #64748B
Use the green+cyan gradient sparingly as the hero/CTA/AI signature, not everywhere.

Status color system (use consistently as pills/dots):
- Available = volt green · Reserved/Wait = amber · In use = cyan · Faulty = rose · Closed/Offline = slate

Typography:
- Display/headings: a geometric grotesk (Space Grotesk / Sora), bold, tight tracking.
- Body/UI: Inter.
- Numbers (prices, %, kWh, minutes, distance): tabular lining figures, emphasized.
- Money format: Vietnamese dong, e.g. "8.000 ₫" or "8,000 VND".

Shape & spacing: rounded-2xl to rounded-3xl cards (16–28px radius), pill-shaped chips/buttons,
generous padding, soft layered shadows, subtle 1px light borders. On dark surfaces add a faint
inner glow on "charging/available" elements.

Iconography: rounded line icons (lucide style) — bolt, plug, battery, map pin, motorbike.

Motion (describe in handoff): charge-bar fill, gentle pulse on "Available now", chip press
feedback, numbers that tick when the estimate updates, AI "thinking" dots.

Accessibility: WCAG AA contrast, 44px min touch targets, never encode status by color alone
(pair with icon/label), large legible numerals for at-a-glance reading while on a motorbike.

Bilingual-ready: layouts must tolerate Vietnamese + English strings (slightly longer labels).
```

**Want a different vibe? Two alternates to try as variants:**
- *Alt A — "Neo-energy / bold":* high-contrast, chunky rounded blocks, oversized numerals, near-neon volt green on ink, playful but premium.
- *Alt B — "Soft premium / light":* mostly white, lots of air, pastel mint+sky tints, thin type, Apple-Wallet-like calm.

---

## 3. Information architecture

**Rider app (mobile, 375px):** Home (find & compare) · Map · AI Copilot chat · Reserve flow · My Bookings · (new) Onboarding/Login.
**Owner console (responsive web, 1440px / tablet):** Overview metrics · Live charts · Station controls · Charger management · Insights · Bookings.

---

## 4. Screen prompts (copy-paste)

### 4.0 Multi-screen flow (optional — generates the rider app as one flow)
```
Generate an electric-motorcycle charging app called eVcN for riders in Ho Chi Minh City,
mobile (375px), using the eVcN design system above. Screens:
- Onboarding + login (with social auth + Vietnamese phone OTP)
- Home: find & compare nearby charging stations with filters and a map preview
- Map: full-screen HCMC map with station pins
- AI Copilot chat: conversational assistant that asks a clarifying question then recommends one station
- Reserve a charger: booking form with a live cost/time estimate, then a confirmation screen
- My Bookings: list of reservations
Keep one consistent bottom navigation: Home, Map, Copilot, Bookings.
```

---

### 4.1 Rider Home — find & compare
```
Home screen for eVcN rider app (mobile, 375px), using the eVcN design system.

Key features:
- Top bar: eVcN bolt logo, current district ("District 1, HCMC"), and a battery indicator chip (e.g. "23%").
- Hero "ask" entry: a prominent pill/search that says "Ask eVcN Copilot — where should I charge?" opening the AI chat.
- Filter chips row: Fast charging · Cheapest · Available now · Closest (toggleable pills).
- Compact map preview card with 5 station pins (green = open, slate = closed), tap to expand.
- Vertical list of station cards (see component spec), each showing: station name + district,
  Open/Closed pill, star rating (4.4–4.8), distance (km), charger type (Standard/Fast/Ultra-fast),
  ports available "3/5", wait time (min), price per kWh in VND, a port-availability progress bar,
  and a primary "Reserve" button (disabled state when closed or 0 ports).
- Bottom nav: Home, Map, Copilot, Bookings.

Visual style: electric-calm, volt-green CTA, charge gradient on the Copilot pill, tabular numerals.
Platform: iOS-style mobile, 375px.
```

### 4.2 Map
```
Full-screen map screen for eVcN (mobile, 375px), eVcN design system.

Key features:
- HCMC map with 5 custom station pins; pin color = status (green available, amber busy, slate closed),
  pin shows ports free badge.
- Floating filter chips at top (Fast / Cheapest / Available now / Closest).
- Bottom sheet (draggable) listing the nearest stations as mini cards; tapping a pin selects its card.
- "Recenter" and "list view" floating buttons.
- A subtle charge-gradient route line from the rider's location to the selected station.

Platform: mobile 375px. Style: dark map option with glowing volt-green pins.
```

### 4.3 AI Copilot chat (the signature screen)
```
AI assistant chat screen "eVcN Copilot" for the eVcN rider app (mobile, 375px), eVcN design system.

Context: a conversational charging consultant. It is CALM and helpful. When the rider's request is
vague it asks ONE clarifying question with tappable quick-reply chips; for clear requests it answers
immediately. It recommends exactly ONE station and offers to reserve.

Key features:
- Header: "eVcN Copilot" with a cyan AI avatar, "Online" status dot, charge-gradient accent.
- Chat thread with two bubble styles: rider (right, solid) and Copilot (left, light/dark card).
- A "thinking" indicator: three pulsing dots, "eVcN Copilot is thinking…".
- CLARIFYING MESSAGE example: Copilot asks "What matters most — nearest, cheapest, or fastest?
  And your current battery % helps." followed by QUICK-REPLY CHIPS:
  [Nearest] [Cheapest] [Fastest] [Available now] [Just recommend one].
- RECOMMENDATION CARD (embedded in a Copilot bubble): station name + type badge, a one-line reason,
  4 stat tiles (≈ minutes, ≈ cost in VND, kWh needed, ports available), and a full-width
  "Reserve recommended charger" button.
- Suggested-prompt chips above the input: "Nearest fast charger", "Cheapest?",
  "Charge near District 1 before 6pm", "80% in under 45 min".
- Input bar with text field + send button (charge-gradient).

Visual style: AI moments use the cyan/charge-gradient; recommendation card feels confident and scannable.
Platform: mobile 375px.
```

### 4.4 Reserve a charger (booking) + confirmation
```
Two mobile screens for eVcN (375px), eVcN design system: a reservation form and a success screen.

Screen A — Reserve:
- Selected station header: name, location, badges (charger type, "3/5 ports", "4,000 ₫/kWh").
- Form fields: Motorcycle model (text, default "VinFast Feliz S"), Name, Phone (Vietnamese format),
  Preferred time (dropdown of 30-min slots 14:30–18:00), Current battery % and Target battery %
  (two compact number inputs or sliders).
- A prominent "LIVE ESTIMATE" panel on a dark charge-gradient card that updates as inputs change:
  big estimated cost in VND, plus rows for charger type, price/kWh, kWh needed, charging duration (min).
- Inline validation (invalid phone, target must exceed current battery) shown as a rose alert.
- Primary "Confirm booking" button (charge-gradient).

Screen B — Confirmation:
- Big success check, "Booking confirmed", booking ID (e.g. "EVCN-104812"), station + time summary,
  a charge-bar animation, and buttons "View in My Bookings" and "Done".

Platform: mobile 375px. Emphasis on the live, animated estimate.
```

### 4.5 My Bookings
```
"My Bookings" screen for eVcN rider app (mobile, 375px), eVcN design system.

Key features:
- Segmented control: Upcoming · Past.
- Booking cards: station name, district, date/time, motorcycle model, estimated cost (VND),
  and a status pill (Reserved = amber, Completed = green, Cancelled = slate).
- Each card: "Navigate" and "Cancel" secondary actions; primary tap opens detail.
- Empty state: friendly illustration + "No reservations yet — ask Copilot to find a charger" CTA.

Platform: mobile 375px.
```

### 4.6 Station Owner Dashboard / Console (the owner side)
```
Owner operations dashboard "Station Owner Dashboard" for eVcN (responsive web, desktop 1440px,
also tablet), eVcN design system. Audience: a small charging-station owner. It must be both an
overview AND a control panel — the owner can manage stations and chargers here.

Layout:
- Dark hero header: title, short subtitle, and 3 quick metrics (Utilization %, Live sessions, Faults).
- Metric cards row (6): Total chargers, Available chargers, Active sessions, Revenue today (VND),
  Utilization rate %, Fault alerts (the last in rose).
- "Station controls" card — a table of the owner's 5 stations, each row with:
  station name + district, an Open/Closed toggle, an editable Price/kWh (VND) input,
  ports "3/5", and a "+ Add charger" button.
- Charts row (2): an area chart "Revenue today" across the day, and a bar chart "Station utilization"
  (live % per station: D1, Thao Dien, D7, Binh Thanh, Tan Binh).
- "Charger status" table: Charger ID, Station, Type, Status pill, Current user, Session time, and an
  ACTIONS column with small buttons: Mark faulty / Mark fixed / Free / Remove.
- "AI insights" panel (dark, cyan accent): 3–4 data-driven suggestions, e.g. "District 1 is your
  busiest site at 86% — add fast chargers for the evening peak", "1 charger faulty (Thao Dien) —
  fixing it recovers lost revenue today", "Demand peaks 5–8pm".
- "Recent bookings" table at the bottom.

Visual style: clean, data-dense but breathable; green/amber/rose status system; tabular numerals;
charts use volt-green and cyan. Platform: responsive web, desktop-first (1440px), graceful at tablet.
```

### 4.7 States (generate alongside the above)
```
For the eVcN app, also design these states in the eVcN design system:
- Loading: skeleton station cards (shimmer) and a Copilot "thinking" state.
- Empty: no stations match filters ("No open chargers nearby — widen your filters"); no bookings yet.
- Error: lost connection / availability unavailable ("We couldn't confirm live availability — showing
  last known status") with a Retry button.
- Disabled/closed: a station card that is Closed or has 0 ports, with the Reserve button visibly disabled.
```

---

## 5. Reusable components (ask Stitch to define these once)

- **Station card** — name + district, status pill, rating, distance, type, "ports x/y", wait, price/kWh, port-availability progress bar, Reserve button (+ disabled variant).
- **Status pill / dot** — Available (green) · Reserved/Wait (amber) · In use (cyan) · Faulty (rose) · Closed (slate); always icon + label.
- **Quick-reply chip** — pill, tappable, used under Copilot clarifying questions.
- **Recommendation card** — compact result inside a chat bubble: reason + 4 stat tiles + Reserve CTA.
- **Live estimate panel** — dark charge-gradient card with a big VND number and supporting rows.
- **Metric card** — label, big tabular number, optional helper line, status tint.
- **Owner action button** — small pill buttons in table rows (Fault/Fix/Free/Remove, Open/Close, Add).
- **Bottom navigation** (rider) — Home · Map · Copilot · Bookings.

---

## 6. Sample data & copy (paste so designs feel real)

**Stations (HCMC):**
| Station | District | Dist | Type | Ports | Wait | Price/kWh | Rating | Status |
|---|---|---|---|---|---|---|---|---|
| eVcN District 1 Hub | District 1 | 1.2 km | Fast | 3/5 | 0 min | 4,000 ₫ | 4.8 | Open |
| eVcN Thao Dien Green | Thao Dien | 4.8 km | Ultra-fast | 1/4 | 8 min | 5,200 ₫ | 4.7 | Open |
| eVcN District 7 Crescent | District 7 | 7.4 km | Standard | 4/4 | 0 min | 3,300 ₫ | 4.5 | Open |
| eVcN Binh Thanh Metro | Binh Thanh | 2.7 km | Fast | 0/3 | 18 min | 3,800 ₫ | 4.4 | Open |
| eVcN Tan Binh Airport | Tan Binh | 6.1 km | Ultra-fast | 2/4 | 5 min | 4,900 ₫ | 4.6 | Closed |

**Copilot sample turn:** Rider: "I need to charge." → Copilot: "Happy to help! What matters most — nearest, cheapest, or fastest? And your current battery % helps." → chips → Rider taps "Cheapest" → recommendation card for "eVcN District 7 Crescent · 3,300 ₫/kWh · ≈ 30 min · ≈ 8,000 ₫".
**Owner metrics:** Utilization 74% · Live sessions 3 · Faults 1 · Revenue today 318,000 ₫.
**Vehicles:** VinFast Feliz S, VinFast Klara S, VinFast Evo200, Dat Bike Weaver 200, Yadea Orla, Selex Camel.

---

## 7. Responsive & platform notes
- **Rider:** mobile-first (design at 375px; verify 320–430px). Thumb-reachable CTAs; sticky bottom nav; big tap targets.
- **Owner:** desktop-first (1440px) with a tablet (768px) breakpoint — tables become stacked cards on narrow widths.
- Keep one shared design system across both so the brand reads as one product.

## 8. Iteration playbook (in Stitch)
- **Annotate-to-edit** for small fixes: "make the Reserve button volt-green and full-width", "increase card spacing", "use tabular numerals on price".
- **Variants** worth generating: the **station card** (compact vs. expanded), the **Copilot recommendation card**, and the **Home hero** (map-first vs. ask-first).
- **Progressive refinement:** start from the prompt → adjust color/density → add empty/loading/error → finalize.
- **Mood test:** regenerate the Home + Copilot screens in *Alt A (bold)* and *Alt B (soft premium)* from §2 to compare directions before committing.

---

### Design principles to hold onto (the redesign must keep these)
1. **One confident answer**, not a wall of options — the Copilot recommendation is the hero.
2. **Trust signals everywhere** — honest live status, transparent VND estimate, clear "available vs. closed".
3. **At-a-glance numerics** — a rider reads price/time/ports in a second; tabular, large, high-contrast.
4. **Two-sided clarity** — rider = calm & guided; owner = dense & controllable; same brand.
5. **Status is never color-only** — pair every state with an icon + label for accessibility.
