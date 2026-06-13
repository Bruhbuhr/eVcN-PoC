import { ASSISTANT_SYSTEM_PROMPT, answerChargingQuery } from "./assistant";
import { stations } from "../data/mockData";

test("defines a consultant-style system prompt for the local assistant", () => {
  expect(ASSISTANT_SYSTEM_PROMPT).toContain("charging consultant");
  expect(ASSISTANT_SYSTEM_PROMPT).toContain("electric motorcycle");
  expect(ASSISTANT_SYSTEM_PROMPT).toContain("mock eVcN station data");
  expect(ASSISTANT_SYSTEM_PROMPT).toContain("Offer a reservation");
});

test("responds to greetings without recommending a station", () => {
  const response = answerChargingQuery("hello", stations);

  expect(response.intent).toBe("greeting");
  expect(response.station).toBeNull();
  expect(response.canReserve).toBe(false);
  expect(response.message).toContain("Hi");
  expect(response.message).toContain("tell me");
});

test("responds to mistyped greetings without recommending a station", () => {
  const response = answerChargingQuery("helu", stations);

  expect(response.intent).toBe("greeting");
  expect(response.station).toBeNull();
  expect(response.canReserve).toBe(false);
  expect(response.message).toContain("tell me");
});

test("recommends the District 1 hub for charging near District 1 before 6pm", () => {
  const response = answerChargingQuery("I need to charge near District 1 before 6pm", stations);

  expect(response.intent).toBe("beforeTime");
  expect(response.needSummary).toContain("before 6pm");
  expect(response.station.name).toBe("eVcN District 1 Hub");
  expect(response.message).toContain("I recommend");
  expect(response.message).toContain("District 1");
  expect(response.message).toContain("Estimated cost");
  expect(response.canReserve).toBe(true);
});

test("recommends the nearest charger for nearest charger queries", () => {
  const response = answerChargingQuery("Find the nearest charger", stations);

  expect(response.intent).toBe("nearest");
  expect(response.station.distanceKm).toBe(Math.min(...stations.filter((s) => s.isOpen && s.availablePorts > 0).map((s) => s.distanceKm)));
  expect(response.reason).toContain("closest");
});

test("recommends the cheapest available station", () => {
  const response = answerChargingQuery("Which charger is cheapest?", stations);

  expect(response.intent).toBe("cheapest");
  expect(response.station.pricePerKwh).toBe(Math.min(...stations.filter((s) => s.isOpen && s.availablePorts > 0).map((s) => s.pricePerKwh)));
});

test("recommends the fastest available charger", () => {
  const response = answerChargingQuery("What is the fastest charger right now?", stations);

  expect(response.intent).toBe("fastest");
  expect(response.station.chargerType).toBe("Ultra-fast");
  expect(response.durationMinutes).toBeLessThan(40);
});

test("recommends an available now station with no wait", () => {
  const response = answerChargingQuery("Show me chargers available now", stations);

  expect(response.intent).toBe("availableNow");
  expect(response.station.isOpen).toBe(true);
  expect(response.station.availablePorts).toBeGreaterThan(0);
  expect(response.station.waitMinutes).toBe(0);
});

test("answers target battery timing queries with an estimated duration", () => {
  const response = answerChargingQuery("Can I charge to 80% in under 45 minutes?", stations);

  expect(response.intent).toBe("targetBattery");
  expect(response.targetBattery).toBe(80);
  expect(response.durationMinutes).toBeLessThanOrEqual(45);
  expect(response.canReserve).toBe(true);
});

test("answers station owner insight queries without offering a reservation", () => {
  const response = answerChargingQuery("Give me station owner insights for utilization and faults", stations);

  expect(response.intent).toBe("ownerInsights");
  expect(response.canReserve).toBe(false);
  expect(response.station).toBeNull();
  expect(response.insights).toEqual(expect.arrayContaining([expect.stringContaining("utilization")]));
  expect(response.message).toContain("owner view");
});
