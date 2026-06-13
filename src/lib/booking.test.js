import {
  createBooking,
  estimateCharging,
  loadSavedNetworkState,
  saveNetworkState,
  updateStationAvailability,
} from "./booking";
import { stations } from "../data/mockData";

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
