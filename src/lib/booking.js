const STORAGE_VERSION = "motorcycle-v1";
const BATTERY_CAPACITY_KWH = 4;
const SPEEDS = {
  Standard: 1.5,
  Fast: 3.5,
  "Ultra-fast": 6,
};

export function formatVnd(value) {
  return `${Math.round(value).toLocaleString("vi-VN")} VND`;
}

export function estimateCharging({ station, currentBattery, targetBattery, chargerType }) {
  const current = Number(currentBattery);
  const target = Number(targetBattery);
  const safeTarget = Number.isFinite(target) ? Math.min(Math.max(target, 0), 100) : 80;
  const safeCurrent = Number.isFinite(current) ? Math.min(Math.max(current, 0), 100) : 30;
  const percentNeeded = Math.max(safeTarget - safeCurrent, 0);
  const kwhNeeded = Math.round((BATTERY_CAPACITY_KWH * percentNeeded) / 100);
  const speed = SPEEDS[chargerType || station?.chargerType] || SPEEDS.Fast;
  const durationMinutes = Math.max(10, Math.round((kwhNeeded / speed) * 60 + (station?.waitMinutes || 0) + 5));
  const estimatedCost = Math.round((kwhNeeded * (station?.pricePerKwh || 0)) / 1000) * 1000;

  return {
    kwhNeeded,
    durationMinutes,
    estimatedCost,
  };
}

export function createBooking({
  station,
  vehicleModel,
  currentBattery,
  targetBattery,
  preferredTime,
  customerName,
  phone,
}) {
  const estimate = estimateCharging({
    station,
    currentBattery,
    targetBattery,
    chargerType: station.chargerType,
  });
  const id = `EVCN-${Date.now().toString().slice(-6)}`;

  return {
    id,
    customerName,
    phone,
    vehicleModel,
    stationId: station.id,
    stationName: station.name,
    chargerType: station.chargerType,
    currentBattery: Number(currentBattery),
    targetBattery: Number(targetBattery),
    preferredTime,
    status: "Reserved",
    createdAt: new Date().toISOString(),
    ...estimate,
  };
}

export function updateStationAvailability(stationList, stationId) {
  return stationList.map((station) => {
    if (station.id !== stationId) return station;
    return {
      ...station,
      availablePorts: Math.max(station.availablePorts - 1, 0),
    };
  });
}

export function loadSavedBookings(seedBookings) {
  try {
    ensureStorageVersion();
    const saved = window.localStorage.getItem("evcn-bookings");
    return saved ? JSON.parse(saved) : seedBookings;
  } catch {
    return seedBookings;
  }
}

export function saveBookings(bookings) {
  try {
    window.localStorage.setItem("evcn-bookings", JSON.stringify(bookings));
  } catch {
    // Local persistence is best-effort in this POC.
  }
}

export function loadSavedNetworkState(key, seedData) {
  try {
    ensureStorageVersion();
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : seedData;
  } catch {
    return seedData;
  }
}

export function saveNetworkState(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Local persistence is best-effort in this POC.
  }
}

function ensureStorageVersion() {
  const currentVersion = window.localStorage.getItem("evcn-storage-version");
  if (currentVersion === STORAGE_VERSION) return;

  window.localStorage.removeItem("evcn-bookings");
  window.localStorage.removeItem("evcn-stations");
  window.localStorage.removeItem("evcn-chargers");
  window.localStorage.setItem("evcn-storage-version", STORAGE_VERSION);
}
