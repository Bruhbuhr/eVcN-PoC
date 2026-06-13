# Journey Map: eVcN (Rider — "Commuter Linh")

*The end-to-end experience of an HCMC e-motorbike rider, from realizing she needs a charge to becoming an eVcN promoter. Mapped against the actual POC features so each stage points to something the product does (or must do next).*

## Discover
*   **Internal trigger:** battery drops to ~20% on the commute; the "where do I charge?" anxiety spikes.
*   **External triggers:** a friend mentions an app that *reserves* a charger; sees eVcN at a station she already uses; a delivery-driver group on Zalo/Facebook recommends it.
*   **Channels she searches:** Google Maps ("ev charger near me" — but it doesn't show availability), App Store / Google Play, Zalo/Facebook rider communities, word of mouth.
*   **Impact:** top-of-funnel must win on the promise of *availability + reservation*, not just "another map." SEO/ASO around "trạm sạc xe máy điện gần đây" (nearby e-motorbike charging) and HCMC district names.

## Aware
*   **What she evaluates:** Is this real (live data) or just a list? Does it cover *my* districts (D1, Binh Thanh, Thao Dien, D7, Tan Binh)? Is it free to use? Will it actually hold a port?
*   **What she reads:** the landing/driver hero ("Find and reserve electric motorcycle charging in seconds"), the map of HCMC pins, station cards showing distance, type, ports, wait, price, and rating (4.4–4.8★).
*   **Objections:** "Is the availability accurate?", "Will I get charged if I don't show up?", "Is the price honest?"
*   **Impact:** the value proposition (one trustworthy recommendation + guaranteed port) must be visible in the first screen; trust elements (ratings, transparent estimate, clear "mock vs. live" honesty) reduce skepticism.

## Convert
*   **The moment:** she asks **eVcN Copilot** a real question — *"I need to charge near District 1 before 6pm"* — and gets **one** recommendation with a reason, a time/cost estimate, and a **Reserve** button. Or she filters station cards (Fast / Cheapest / Available now / Closest) and taps **Reserve Charger**.
*   **Steps required:** open Driver/Assistant → ask or filter → review the single recommendation card (duration, cost, kWh, ports) → **Reserve** → enter motorcycle model, name, phone, preferred time, current/target battery → see the **live estimate** recompute → **Confirm booking** → confirmation screen with a Booking ID.
*   **Emotional state:** hopeful but cautious; this is where friction kills the funnel.
*   **Impact:** drives onboarding/Time-to-Value design — the reservation must be sub-minute, the estimate must feel honest, and the confirmation must feel *guaranteed*. (Current POC: ~650 ms response, inline validation, focus-trapped modal.)

## Retain (Retent)
*   **What brings her back:** it *worked* — the port was free, the cost matched the estimate. The Copilot becomes her default "where do I charge?" answer 3–5×/week. Habit loop: low battery → ask Copilot → reserve → charge.
*   **What would make her churn:** a reservation not honored, stale availability, a charger that was "Available" but actually faulty, slow or confusing answers, or hidden fees.
*   **Retention levers (now & next):** saved motorcycle/profile (no re-entry), "your usual station" shortcuts, push when a usually-busy hub is free, reliable live status, and a clean booking history (the Bookings view).
*   **Impact:** retention is the real PMF signal — informs notifications, saved preferences, and an obsessive focus on availability accuracy.

## Advocate
*   **How she shares:** tells her commuter and delivery friends, posts in Zalo/Facebook rider groups, shares a referral link.
*   **What motivates sharing:** genuine relief ("it actually holds a charger for you"), a referral reward (free/discounted kWh), and a bit of status (the modern, organized rider).
*   **Impact:** drives a referral program, shareable booking confirmations, and community partnerships with delivery fleets and dealerships — the cheapest acquisition channel, feeding back into **Discover** for the next rider.

---

### Snapshot table

| Stage | Rider goal | eVcN touchpoint (POC) | Key emotion | Biggest risk |
|---|---|---|---|---|
| Discover | "Where do I charge?" | Map + reservation promise | Anxious | Invisible / undiscoverable |
| Aware | "Can I trust it?" | Hero, station cards, ratings | Skeptical | Looks like "just a map" |
| Convert | "Get me a charger" | Copilot recommendation → Reserve → Confirm | Hopeful, cautious | Friction in booking |
| Retain | "My default" | Saved profile, live status, Bookings | Relieved, habitual | Reservation not honored |
| Advocate | "Tell my friends" | Referral, share confirmation | Loyal, proud | No incentive to share |
