# eVcN POC — Build Plan

Status: **design approved, awaiting go-ahead to implement.** Two pieces of work, sequenced.
Constraint that applies to both: client-only POC (React + Vite + Tailwind + `localStorage`, no backend, no real LLM, no auth). The seed `src/data/mockData.js` arrays and `updateStationAvailability` are pinned by tests and must not change shape (5 stations, 20 chargers, exactly 1 faulty). All new logic lives in runtime state + new pure functions, with unit tests.

**Order:** Part A (assistant) first — it's the current priority — then Part B (dashboard).

---

## Part A — Conversational rule-based assistant

### Problem
`detectIntent` in `src/lib/assistant.js` only special-cases a greeting. Every other input falls through to `answerChargingQuery`, which fills hard-coded defaults (current 30%, target 80%) and **instantly returns a full recommendation + reserve offer**. There is no conversation memory and no follow-up, so after "hi → hello" the next message gets a canned dump. It reads as mocked.

### Goal
Make eVcN Copilot feel like a real assistant: acknowledge the user, ask a clarifying follow-up when the request is vague, remember answers across turns, and only recommend once it has enough — while staying fully offline (rule-based, no API key, no cost).

### Understanding summary
- **What:** a stateful, multi-turn conversation layer over the existing rule engine.
- **Why:** kill the "instant canned reply" feel; make the demo believable.
- **Who:** rider ("Commuter Linh") in the AI Assistant view.
- **Key principle:** *clear* requests still get an immediate recommendation (e.g., "cheapest charger"); only *vague* requests trigger a clarifying question. This keeps existing tests green and avoids over-asking.

### Assumptions (defaults — adjustable)
- Conversation tracks **slots**: `priority` (nearest/cheapest/fastest/availableNow/beforeTime), `district`, `currentBattery`, `targetBattery`, `timeLabel`, `clarifyCount`.
- **At most one** clarifying question on the vague path (greeting → vague → clarify → recommend). After one clarification, it recommends a balanced pick rather than asking again (no loops, not annoying).
- Missing battery levels default to 30% → 80% but the reply **states the assumption** and invites refinement.
- Quick-reply chips accompany the clarifying question (Nearest / Cheapest / Fastest / Available now / "Just recommend one") so the user can answer in one tap.
- Typing delay varies by response type (~500 ms to ask, ~900 ms to recommend) to simulate "checking stations".

### Design
New exported `converse(query, stations, slots)` in `assistant.js` returns `{ message, kind, quickReplies, slots, ...recommendationFields }` where `kind ∈ {greeting, clarify, recommendation, ownerInsights}`.

Flow per turn:
1. Detect intent + parse current/target battery, district, time, and "defer" signals ("any", "just recommend", "you choose", "idk").
2. Merge parsed values into the carried `slots`.
3. Branch:
   - greeting → existing greeting reply.
   - owner-insight intent → existing `ownerInsightResponse`.
   - has a priority (specific intent now or from a prior turn) **or** a defer signal → **recommend** (acknowledging the slots; refine hint if battery was never given).
   - no priority and `clarifyCount === 0` → **clarify** (ask priority + battery, attach quick replies, set `clarifyCount = 1`).
   - no priority and already clarified once → **recommend** a balanced pick.
4. Recommendation reuses the existing `pickStation` / `estimateCharging` / `buildReason`, wrapped in a conversational, slot-aware message.

`answerChargingQuery` keeps its current contract (used directly by tests and reused internally), so specific-intent behavior is unchanged.

### App/UI changes (`src/App.jsx`)
- Add `assistantSlots` state; `handleAssistantQuery` computes `converse(...)` synchronously, picks the delay by `kind`, then appends the assistant message and updates slots.
- Render **quick-reply chips** under the latest assistant message (in `ChatBubble`); clicking sends that text via `onAsk`.

### Tests
- New `converse` tests: vague input → `clarify` + quick replies (no station); follow-up "cheapest" → `recommendation` (cheapest station); "just recommend one" → `recommendation`; greeting still greeting.
- Existing `answerChargingQuery` and App tests stay green (they use specific intents / greetings).
- Add one App test: vague "I need to charge" shows a clarifying question and **no** Reserve button.

### Non-goals
No real LLM/API, no streaming, no Vietnamese NLU beyond existing place-name matching, no more than one clarifying question.

### Decision log (A)
- **Rule-based conversational over real LLM** — user choice; zero key/cost, fits POC. (Real-Claude path captured in `deliverables/05_product_roadmap.md` "Next".)
- **Clarify only on vague input** — preserves clear-intent UX and all existing tests; avoids over-asking.
- **Cap at one clarifying question** — realism without annoyance / loops.
- **Wrap, don't replace `answerChargingQuery`** — protects the tested contract.

---

## Part B — Interactive Owner Dashboard (real & interactive)

### Goal
Turn the read-only Station Dashboard into a working owner console whose edits propagate to riders. Owner can: open/close a station, mark a charger faulty / fixed (and free it), edit price per kWh, and add/remove chargers — with per-station drill-down and **data-driven** AI insights. Changes flow to the Driver App, Booking modal, and eVcN Copilot, and persist.

### Understanding summary
- **What:** owner write-actions on shared `stations`/`chargers` state + a live, data-driven dashboard.
- **Why:** demonstrate the two-sided flywheel end-to-end (owner change → rider sees it when viewing and booking).
- **Who:** owner ("Operator Tuan") primary; rider sees downstream effects.
- **Non-goals:** no backend/payments/LLM/auth/multi-owner; revenue area chart stays illustrative.

### Approach (chosen of 2)
**Shared-state sync helper** (recommended): a pure `syncStationPorts(stations, chargers)` recomputes each station's `availablePorts` (chargers with status `Available`) and `totalPorts` (charger count) after any charger mutation. Rider/Copilot/booking code is untouched (lowest risk) yet everything propagates because they read the same state.
*Rejected — "derive a separate liveStations array":* purer single-source-of-truth but rewires every rider/Copilot/booking call site for no user-visible gain (YAGNI).

### What to build
1. `src/lib/booking.js` — pure, tested `syncStationPorts(stations, chargers)` + a charger-id generator for "add charger". Keep `updateStationAvailability` (test-pinned).
2. `src/lib/assistant.js` — data-driven `buildOwnerInsights(stations, chargers)` (highest-utilization station, active faults & revenue impact, peak window, closed stations) replacing the 3 hard-coded insight cards.
3. `src/App.jsx` — owner handlers: `toggleStationOpen`, `setStationPrice`, `setChargerStatus` (faulty / fixed / free), `addCharger`, `removeCharger` (each re-syncs station ports). Pass `stations` + handlers to `Dashboard`. Dashboard gains: a **Station Controls** card (open/close toggle, price edit, +Add charger), an **Actions** column on the charger table (Mark faulty / Mark fixed / Remove), data-driven insights, and a **utilization chart derived from live data**. Guard divide-by-zero for a station with 0 chargers.

### Tests
- Unit: `syncStationPorts`, `buildOwnerInsights`.
- App-level: close a station → it drops out of the rider "Available now" filter and can't be reserved (propagation proof).
- Full existing suite stays green; seed data unchanged.

### Decision log (B)
- **Sync-helper over derive** — risk/churn vs. no user-facing benefit.
- **Insights derived, not hard-coded** — must reflect live edits.
- **Utilization chart live, revenue chart static** — high-value/low-cost vs. low-value time-series.
- **Seed `mockData` untouched** — test contract.
