import { estimateCharging, formatVnd } from "./booking";

export const ASSISTANT_SYSTEM_PROMPT = `You are eVcN Copilot, a calm mobility charging consultant for electric motorcycle riders in Ho Chi Minh City.

Your job is to make charging feel easy: understand the rider's need, compare only the mock eVcN station data, recommend one best station, and explain the choice in simple practical language.

Always do these steps internally:
1. Identify the rider's intent: nearest charger, cheapest charger, fastest charger, available now, charging before a time, charging to a target battery percentage, or station owner insights.
2. Use only local mock data. Do not claim live availability, real payment, real navigation, or a real AI backend.
3. For driver questions, recommend one station, mention why it fits, estimate charging duration, estimate cost, and keep the tone confident but not pushy.
4. Offer a reservation when the recommended station is open and has available ports.
5. If the user asks owner questions, switch to concise SaaS-style operational insights and do not offer a driver reservation.

Voice: helpful consultant, clear, brief, reassuring, and easy for a first-time EV motorcycle rider to follow.`;

export const ASSISTANT_INTRO_MESSAGE =
  "Hi, I am eVcN Copilot, your mobility charging consultant. Tell me where you are, how fast you need to charge, or your target battery, and I will recommend the easiest motorcycle charging option.";

function availableOpen(stations) {
  return stations.filter((station) => station.isOpen && station.availablePorts > 0);
}

function byDistance(a, b) {
  return a.distanceKm - b.distanceKm;
}

const GREETING_WORDS = ["hi", "hello", "hey", "hiya", "helo", "hallo", "hullo", "hai", "yo", "heya", "sup", "howdy"];

function levenshtein(a, b) {
  const rows = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

// Greetings are short and conversational. Exact multi-word greetings are matched
// directly; single typo'd tokens ("helu", "hii") are matched within edit distance 1.
function isGreeting(q) {
  const cleaned = q.trim().replace(/[!.?,]+$/g, "");
  if (/^(hi|hello|hey|xin chao|xin chào|chao|chào|good morning|good afternoon|good evening)$/.test(cleaned)) {
    return true;
  }
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length !== 1) return false;
  const first = tokens[0];
  if (first.length < 2 || first.length > 7) return false;
  return GREETING_WORDS.some((word) => levenshtein(first, word) <= 1);
}

function detectIntent(query) {
  const q = query.toLowerCase();
  if (isGreeting(q)) return "greeting";
  if (q.includes("owner") || q.includes("dashboard") || q.includes("insight") || q.includes("utilization") || q.includes("fault")) return "ownerInsights";
  if (q.includes("cheapest") || q.includes("lowest") || q.includes("price")) return "cheapest";
  if (q.includes("available now") || q.includes("open now") || q.includes("no wait")) return "availableNow";
  if (q.includes("before") || /\b\d{1,2}\s*(am|pm)\b/.test(q)) return "beforeTime";
  if (q.includes("%") || q.includes("target") || q.includes("battery")) return "targetBattery";
  if (q.includes("fastest") || q.includes("ultra") || q.includes("quickest")) return "fastest";
  if (q.includes("nearest") || q.includes("closest") || q.includes("near me")) return "nearest";
  if (q.includes("fast")) return "fastest";
  return "general";
}

function extractTargetBattery(query) {
  const match = query.match(/(?:to|target|reach)\s*(\d{1,3})\s*%/i) || query.match(/(\d{2,3})\s*%/);
  if (!match) return 80;
  return Math.min(Math.max(Number(match[1]), 10), 100);
}

function extractCurrentBattery(query) {
  const match = query.match(/from\s*(\d{1,3})\s*%/i);
  if (!match) return 30;
  return Math.min(Math.max(Number(match[1]), 0), 95);
}

function extractTimeLabel(query) {
  return query.match(/\b(\d{1,2}\s*(?:am|pm))\b/i)?.[1]?.replace(/\s+/g, "") || null;
}

function extractDistrict(query, stations) {
  const q = query.toLowerCase();
  return stations.find((station) => q.includes(station.district.toLowerCase()))?.district || null;
}

function estimateForStation(station, currentBattery, targetBattery) {
  return estimateCharging({
    station,
    currentBattery,
    targetBattery,
    chargerType: station.chargerType,
  });
}

function pickStation(intent, stations, details) {
  const available = availableOpen(stations);
  const candidates = available.length ? available : stations;
  if (intent === "cheapest") {
    return [...candidates].sort((a, b) => a.pricePerKwh - b.pricePerKwh || byDistance(a, b))[0];
  }
  if (intent === "fastest" || intent === "targetBattery") {
    return [...candidates]
      .sort((a, b) => {
        const aEstimate = estimateForStation(a, details.currentBattery, details.targetBattery);
        const bEstimate = estimateForStation(b, details.currentBattery, details.targetBattery);
        return aEstimate.durationMinutes - bEstimate.durationMinutes || byDistance(a, b);
      })[0];
  }
  if (intent === "availableNow") {
    return [...candidates].sort((a, b) => a.waitMinutes - b.waitMinutes || b.availablePorts - a.availablePorts || byDistance(a, b))[0];
  }
  if (intent === "beforeTime") {
    const districtMatch = details.district ? candidates.find((station) => station.district === details.district) : null;
    return districtMatch || [...candidates].sort((a, b) => a.waitMinutes - b.waitMinutes || byDistance(a, b))[0];
  }
  if (intent === "nearest") {
    return [...candidates].sort(byDistance)[0];
  }
  return [...candidates].sort((a, b) => b.rating - a.rating || byDistance(a, b))[0];
}

function buildNeedSummary(intent, details) {
  const target = `${details.currentBattery}% to ${details.targetBattery}%`;
  const summaries = {
    nearest: "You asked for the nearest available motorcycle charger.",
    cheapest: "You asked for the lowest price per kWh.",
    fastest: `You asked for the fastest charge from ${target}.`,
    availableNow: "You asked for an open station with ports available now.",
    beforeTime: `You need charging${details.district ? ` near ${details.district}` : ""}${details.timeLabel ? ` before ${details.timeLabel}` : " before your preferred time"}.`,
    targetBattery: `You asked whether you can charge from ${target} quickly.`,
    general: "You asked for the best balanced motorcycle charging option.",
  };
  return summaries[intent] || summaries.general;
}

function buildReason(intent, station) {
  if (intent === "nearest") {
    return `${station.name} is the closest available option at ${station.distanceKm}km away.`;
  }
  if (intent === "cheapest") {
    return `${station.name} has the lowest available price at ${formatVnd(station.pricePerKwh)} per kWh.`;
  }
  if (intent === "fastest" || intent === "targetBattery") {
    return `${station.name} has ${station.chargerType.toLowerCase()} motorcycle charging and the shortest estimated charge time.`;
  }
  if (intent === "availableNow") {
    return `${station.name} is open now, has ${station.availablePorts} ports available, and the wait time is ${station.waitMinutes} minutes.`;
  }
  if (intent === "beforeTime") {
    return `${station.name} matches your location and time need with ${station.availablePorts} available ${station.chargerType.toLowerCase()} ports.`;
  }
  return `${station.name} is ${station.distanceKm}km away, rated ${station.rating}, and has ${station.availablePorts} ports available.`;
}

function ownerInsightResponse(stations) {
  const highestUtilization = [...stations].sort((a, b) => (b.totalPorts - b.availablePorts) / b.totalPorts - (a.totalPorts - a.availablePorts) / a.totalPorts)[0];
  const closedStation = stations.find((station) => !station.isOpen);
  const insights = [
    `${highestUtilization.district} utilization is high based on reserved and active ports. Consider adding more fast motorcycle chargers during evening peaks.`,
    "Demand is strongest from 5pm to 8pm, so owner pricing and staffing should focus on that window.",
    closedStation ? `${closedStation.district} is currently closed in the mock data, which can shift riders to nearby stations and reduce daily revenue.` : "All stations are open in the current mock view.",
  ];

  return {
    intent: "ownerInsights",
    needSummary: "You asked for station owner insights.",
    station: null,
    canReserve: false,
    durationMinutes: null,
    estimatedCost: null,
    kwhNeeded: null,
    targetBattery: null,
    currentBattery: null,
    reason: "owner view summary from mock station availability and utilization signals.",
    insights,
    message: `Here is the owner view: ${insights[0]}`,
  };
}

function greetingResponse() {
  return {
    intent: "greeting",
    needSummary: "You greeted eVcN Copilot.",
    station: null,
    canReserve: false,
    durationMinutes: null,
    estimatedCost: null,
    kwhNeeded: null,
    targetBattery: null,
    currentBattery: null,
    reason: "The rider has not shared a charging need yet.",
    insights: [],
    message: "Hi, I am here to help. Please tell me what you need: nearest charger, cheapest option, fastest charge, available now, a district like District 1, or your target battery percentage.",
  };
}

// --- Conversational layer -------------------------------------------------
// Wraps the rule engine in a stateful, multi-turn dialogue: clear requests are
// answered immediately, vague ones get a single clarifying follow-up, and
// answers are remembered across turns via `slots`.

const SPECIFIC_INTENTS = new Set(["nearest", "cheapest", "fastest", "availableNow", "beforeTime", "targetBattery"]);
const CLARIFY_CHIPS = ["Nearest", "Cheapest", "Fastest", "Available now", "Just recommend one"];
const PRIORITY_CHIPS = ["Nearest", "Cheapest", "Fastest", "Available now"];

export function createSlots() {
  return {
    priority: null,
    district: null,
    currentBattery: null,
    targetBattery: null,
    timeLabel: null,
    clarifyCount: 0,
  };
}

function clampPercent(value, lo, hi) {
  return Math.min(Math.max(value, lo), hi);
}

function parseCurrentBattery(query) {
  const match = query.match(/(?:from|at|currently|now|have|got|i'?m at)\s*(\d{1,3})\s*%/i);
  return match ? clampPercent(Number(match[1]), 0, 95) : null;
}

function parseTargetBattery(query) {
  const match = query.match(/(?:to|target|reach|up to|until|hit)\s*(\d{1,3})\s*%/i);
  return match ? clampPercent(Number(match[1]), 10, 100) : null;
}

function detectDefer(query) {
  return /\b(any|anything|whatever|just\s+(recommend|pick|choose|tell|one)|you\s+(choose|pick|decide)|idk|don'?t\s+know|doesn'?t\s+matter|surprise\s+me|best\s+one)\b/i.test(query);
}

function mergeSlots(slots, query, intent, stations) {
  return {
    ...slots,
    priority: SPECIFIC_INTENTS.has(intent) ? intent : slots.priority,
    district: extractDistrict(query, stations) ?? slots.district,
    currentBattery: parseCurrentBattery(query) ?? slots.currentBattery,
    targetBattery: parseTargetBattery(query) ?? slots.targetBattery,
    timeLabel: extractTimeLabel(query) ?? slots.timeLabel,
  };
}

function buildAck(intent, details) {
  switch (intent) {
    case "nearest":
      return "Sure — going for the closest charger.";
    case "cheapest":
      return "Good call — optimizing for price.";
    case "fastest":
      return "Let's get you charged fast.";
    case "targetBattery":
      return `Let's see how quickly you can reach ${details.targetBattery}%.`;
    case "availableNow":
      return "Finding somewhere open with a free port right now.";
    case "beforeTime":
      return details.timeLabel ? `Need you topped up before ${details.timeLabel} —` : "Working around your timing —";
    default:
      return "Here's a solid all-round pick.";
  }
}

function clarifyResponse(slots) {
  return {
    kind: "clarify",
    intent: "clarify",
    needSummary: "A couple of quick details",
    message:
      "Happy to help! To point you to the right charger — what matters most: the nearest, cheapest, or fastest option (or one that is available right now)? And if you know it, your current battery % and target (e.g. 20% to 80%) help me estimate.",
    station: null,
    canReserve: false,
    durationMinutes: null,
    estimatedCost: null,
    kwhNeeded: null,
    currentBattery: null,
    targetBattery: null,
    reason: "",
    insights: [],
    quickReplies: CLARIFY_CHIPS,
    slots,
  };
}

function recommendFromSlots(effectiveIntent, stations, slots) {
  const batteryProvided = slots.currentBattery != null || slots.targetBattery != null;
  const details = {
    currentBattery: slots.currentBattery ?? 30,
    targetBattery: slots.targetBattery ?? 80,
    timeLabel: slots.timeLabel,
    district: slots.district,
  };
  const station = pickStation(effectiveIntent, stations, details) || stations[0];
  const estimate = estimateForStation(station, details.currentBattery, details.targetBattery);
  const needSummary = buildNeedSummary(effectiveIntent, details);
  const reason = buildReason(effectiveIntent, station);
  const canReserve = station.isOpen && station.availablePorts > 0;
  const ack = buildAck(effectiveIntent, details);
  const refine = batteryProvided ? "" : " (I assumed about 30% to 80% — tell me your real battery and target to refine.)";

  const message = canReserve
    ? `${ack} I'd go with ${station.name} — ${reason} It is ${station.distanceKm}km away with a ${station.waitMinutes}-minute wait, and charging ${details.currentBattery}% to ${details.targetBattery}% should take about ${estimate.durationMinutes} minutes (about ${formatVnd(estimate.estimatedCost)}).${refine} Want me to reserve a charger there?`
    : `${ack} The closest match is ${station.name}, but it is not reservable right now (closed or full). ${reason} Tell me another priority, or ask for "available now".`;

  return {
    kind: "recommendation",
    intent: effectiveIntent,
    needSummary,
    message,
    station,
    canReserve,
    currentBattery: details.currentBattery,
    targetBattery: details.targetBattery,
    durationMinutes: estimate.durationMinutes,
    estimatedCost: estimate.estimatedCost,
    kwhNeeded: estimate.kwhNeeded,
    reason,
    insights: [],
    quickReplies: null,
    slots,
  };
}

export function converse(query, stations, slots = createSlots()) {
  const intent = detectIntent(query);

  if (intent === "greeting") {
    return { ...greetingResponse(), kind: "greeting", quickReplies: PRIORITY_CHIPS, slots };
  }
  if (intent === "ownerInsights") {
    return { ...ownerInsightResponse(stations), kind: "ownerInsights", quickReplies: null, slots };
  }

  const nextSlots = mergeSlots(slots, query, intent, stations);
  const isSpecific = SPECIFIC_INTENTS.has(intent);
  const hasPriority = isSpecific || nextSlots.priority != null;

  if (hasPriority || detectDefer(query)) {
    const effectiveIntent = isSpecific ? intent : nextSlots.priority || "general";
    return recommendFromSlots(effectiveIntent, stations, nextSlots);
  }

  // Vague request with no known priority: ask once, then recommend a balanced pick.
  if (nextSlots.clarifyCount === 0) {
    return clarifyResponse({ ...nextSlots, clarifyCount: 1 });
  }
  return recommendFromSlots("general", stations, nextSlots);
}

export function answerChargingQuery(query, stations) {
  const intent = detectIntent(query);
  if (intent === "greeting") return greetingResponse();
  if (intent === "ownerInsights") return ownerInsightResponse(stations);

  const details = {
    currentBattery: extractCurrentBattery(query),
    targetBattery: extractTargetBattery(query),
    timeLabel: extractTimeLabel(query),
    district: extractDistrict(query, stations),
  };
  const station = pickStation(intent, stations, details) || stations[0];
  const estimate = estimateForStation(station, details.currentBattery, details.targetBattery);
  const needSummary = buildNeedSummary(intent, details);
  const reason = buildReason(intent, station);

  return {
    intent,
    needSummary,
    station,
    canReserve: station.isOpen && station.availablePorts > 0,
    currentBattery: details.currentBattery,
    targetBattery: details.targetBattery,
    durationMinutes: estimate.durationMinutes,
    estimatedCost: estimate.estimatedCost,
    kwhNeeded: estimate.kwhNeeded,
    reason,
    insights: [],
    message: `I recommend ${station.name}. ${needSummary} ${reason} It is ${station.distanceKm}km away, wait time is ${station.waitMinutes} minutes, and charging from ${details.currentBattery}% to ${details.targetBattery}% should take about ${estimate.durationMinutes} minutes. Estimated cost: ${formatVnd(estimate.estimatedCost)}. Would you like to reserve a charger?`,
  };
}
