import {
  createBooking,
  createCharger,
  estimateCharging,
  loadSavedNetworkState,
  saveNetworkState,
  syncStationPorts,
  updateStationAvailability,
} from "./booking";
import { chargers, stations } from "../data/mockData";

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
