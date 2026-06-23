import {
  buildRevenueSeries,
  createBooking,
  createCharger,
  createStation,
  estimateCharging,
  loadSavedNetworkState,
  saveNetworkState,
  syncStationPorts,
  updateStationAvailability,
} from "./booking";
import { bookings, chargers, sessions, stations } from "../data/mockData";

test("estimates kWh needed duration and cost for a booking", () => {
  const station = stations[0];
  const estimate = estimateCharging({
    station,
    currentBattery: 30,
    targetBattery: 80,
    chargerType: "Fast",
  });

  expect(estimate.kwhNeeded).toBe(2);
  expect(estimate.durationMinutes).toBe(39);
  expect(estimate.estimatedCost).toBe(8000);
});

test("creates a local booking with a stable booking id", () => {
  const booking = createBooking({
    station: stations[0],
    vehicleModel: "VinFast Feliz S",
    currentBattery: 30,
    targetBattery: 80,
    preferredTime: "17:30",
    customerName: "Linh Tran",
    phone: "0901234567",
  });

  expect(booking.id).toMatch(/^EVCN-/);
  expect(booking.stationId).toBe(stations[0].id);
  expect(booking.estimatedCost).toBe(8000);
  expect(booking.status).toBe("Reserved");
});

test("decrements available ports after reservation", () => {
  const [updated] = updateStationAvailability([stations[0]], stations[0].id);

  expect(updated.availablePorts).toBe(stations[0].availablePorts - 1);
});

test("saves and loads local station or charger state", () => {
  const key = "evcn-test-network";
  const state = [{ id: "station-test", availablePorts: 2 }];

  saveNetworkState(key, state);

  expect(loadSavedNetworkState(key, [])).toEqual(state);
});

test("syncStationPorts derives port counts from the charger list", () => {
  const synced = syncStationPorts(stations, chargers);
  const d1 = synced.find((station) => station.id === "station-d1");
  const d1Chargers = chargers.filter((charger) => charger.stationId === "station-d1");

  expect(d1.totalPorts).toBe(d1Chargers.length);
  expect(d1.availablePorts).toBe(d1Chargers.filter((charger) => charger.status === "Available").length);
});

test("syncStationPorts reflects a charger turning faulty", () => {
  const [available] = chargers.filter((charger) => charger.stationId === "station-d1" && charger.status === "Available");
  const mutated = chargers.map((charger) => (charger.id === available.id ? { ...charger, status: "Faulty" } : charger));

  const before = syncStationPorts(stations, chargers).find((s) => s.id === "station-d1").availablePorts;
  const after = syncStationPorts(stations, mutated).find((s) => s.id === "station-d1").availablePorts;

  expect(after).toBe(before - 1);
});

test("createCharger adds a unique available charger to a station", () => {
  const station = stations.find((s) => s.id === "station-d1");
  const charger = createCharger(station, chargers);

  expect(charger.stationId).toBe("station-d1");
  expect(charger.status).toBe("Available");
  expect(chargers.map((c) => c.id)).not.toContain(charger.id);
  expect(charger.id.startsWith("D1-")).toBe(true);
});

test("createStation builds a seed-shaped station from the registration form", () => {
  const station = createStation(
    { name: "Cafe Volt Hub", district: "District 7", chargerType: "Ultra-fast", chargerCount: 3, pricePerKwh: 4500 },
    stations
  );

  expect(station.id).toBe("station-cafe-volt-hub");
  expect(station.district).toBe("District 7");
  expect(station.chargerType).toBe("Ultra-fast");
  expect(station.pricePerKwh).toBe(4500);
  expect(station.isOpen).toBe(true);
  expect(station.totalPorts).toBe(3);
  expect(station.availablePorts).toBe(3);
  expect(station.mapPosition).toHaveProperty("x");
  expect(stations.map((s) => s.id)).not.toContain(station.id);
});

test("createStation generates a unique id when the slug already exists", () => {
  const existing = [{ id: "station-volt", name: "Volt" }];
  const station = createStation({ name: "Volt", district: "District 1" }, existing);

  expect(station.id).toBe("station-volt-2");
});

test("buildRevenueSeries trends upward and ends at live revenue total", () => {
  const series = buildRevenueSeries(bookings, sessions);
  const expectedTotal =
    sessions.reduce((sum, session) => sum + session.revenue, 0) +
    bookings.reduce((sum, booking) => sum + booking.estimatedCost, 0);

  expect(series).toHaveLength(7);
  expect(series[series.length - 1].revenue).toBe(expectedTotal);
  for (let i = 1; i < series.length; i += 1) {
    expect(series[i].revenue).toBeGreaterThanOrEqual(series[i - 1].revenue);
  }
});

test("buildRevenueSeries grows when a new booking is added", () => {
  const base = buildRevenueSeries(bookings, sessions);
  const withExtra = buildRevenueSeries(
    [...bookings, { preferredTime: "18:00", estimatedCost: 15000, status: "Reserved" }],
    sessions
  );
  const last = (series) => series[series.length - 1].revenue;

  expect(last(withExtra)).toBe(last(base) + 15000);
});

test("createStation chargers never collide with same-district seed charger ids", () => {
  const station = createStation(
    { name: "Second D1 Lot", district: "District 1", chargerType: "Fast", chargerCount: 2 },
    stations
  );
  let list = [...chargers];
  const first = createCharger(station, list);
  list = [...list, first];
  const second = createCharger(station, list);

  expect(first.id).not.toBe(second.id);
  expect(chargers.map((c) => c.id)).not.toContain(first.id);
  expect(chargers.map((c) => c.id)).not.toContain(second.id);
});
