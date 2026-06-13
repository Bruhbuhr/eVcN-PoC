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

function detectIntent(query) {
  const q = query.toLowerCase();
  if (/^(hi|hello|hey|xin chao|xin chào|chao|chào|good morning|good afternoon|good evening)[!.?\s]*$/.test(q)) return "greeting";
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
