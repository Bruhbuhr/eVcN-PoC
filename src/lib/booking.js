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

// Reset a charger to its free/available baseline. Used when an owner frees a
// busy charger and when a rider cancels a reservation, so both paths stay in sync.
export function freeCharger(charger) {
  return { ...charger, status: "Available", currentUser: "-", sessionMinutes: 0 };
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

// Treat the charger list as the source of truth for a station's port counts.
// Recomputes availablePorts (chargers marked "Available") and totalPorts so that
// owner edits to chargers propagate to the rider-facing station data.
export function syncStationPorts(stationList, chargerList) {
  return stationList.map((station) => {
    const own = chargerList.filter((charger) => charger.stationId === station.id);
    return {
      ...station,
      availablePorts: own.filter((charger) => charger.status === "Available").length,
      totalPorts: own.length,
    };
  });
}

const CHARGER_TYPE_LETTER = { Fast: "F", "Ultra-fast": "U", Standard: "S" };

function stationPrefix(station, chargerList) {
  const existing = chargerList.find((charger) => charger.stationId === station.id);
  if (existing?.id?.includes("-")) return existing.id.split("-")[0];
  return station.district
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

// Build a new "Available" charger for a station with a non-colliding id
// (e.g. D1-F06), derived from the station's existing chargers. The id is also
// checked against the whole charger list so a freshly registered station in an
// existing district can't reuse an id another station already holds.
export function createCharger(station, chargerList) {
  const own = chargerList.filter((charger) => charger.stationId === station.id);
  const prefix = stationPrefix(station, chargerList);
  const letter = CHARGER_TYPE_LETTER[station.chargerType] || "C";
  const usedNumbers = own
    .map((charger) => Number(String(charger.id).split("-")[1]?.replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value));
  const taken = new Set(chargerList.map((charger) => charger.id));
  let next = (usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1;
  let id = `${prefix}-${letter}${String(next).padStart(2, "0")}`;
  while (taken.has(id)) {
    next += 1;
    id = `${prefix}-${letter}${String(next).padStart(2, "0")}`;
  }

  return {
    id,
    stationId: station.id,
    station: station.name,
    type: station.chargerType,
    status: "Available",
    currentUser: "-",
    sessionMinutes: 0,
  };
}

const SLUG_DIACRITICS = /[̀-ͯ]/g;

function slugify(text) {
  const slug = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(SLUG_DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "station";
}

const VALID_CHARGER_TYPES = ["Standard", "Fast", "Ultra-fast"];

// Build a new station from the owner onboarding/registration form. Returns a
// station shaped like the seed data (mockData.js) with a collision-free id.
// Chargers are created separately (loop createCharger) so the port-sync effect
// derives availablePorts/totalPorts from them; the counts here are the initial
// values that match the requested charger count.
export function createStation(form = {}, existingStations = []) {
  const name = (form.name || "").trim() || "New eVcN Station";
  const district = form.district || "District 1";
  const chargerType = VALID_CHARGER_TYPES.includes(form.chargerType) ? form.chargerType : "Fast";
  const portCount = Math.max(1, Math.round(Number(form.chargerCount) || 1));
  const pricePerKwh = Math.max(0, Math.round(Number(form.pricePerKwh) || 0));

  const baseId = `station-${slugify(name)}`;
  const taken = new Set(existingStations.map((station) => station.id));
  let id = baseId;
  let suffix = 2;
  while (taken.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const index = existingStations.length;
  return {
    id,
    name,
    location: district,
    district,
    distanceKm: Math.round((2 + ((index * 1.7) % 6)) * 10) / 10,
    chargerType,
    availablePorts: portCount,
    totalPorts: portCount,
    pricePerKwh,
    waitMinutes: 0,
    rating: 5,
    isOpen: true,
    mapPosition: { x: 25 + ((index * 13) % 55), y: 24 + ((index * 17) % 55) },
  };
}

const REVENUE_BUCKETS = [
  { label: "8am", hour: 8 },
  { label: "10am", hour: 10 },
  { label: "12pm", hour: 12 },
  { label: "2pm", hour: 14 },
  { label: "4pm", hour: 16 },
  { label: "6pm", hour: 18 },
  { label: "8pm", hour: 20 },
];

function parseHour(timeLabel) {
  const match = /^(\d{1,2})/.exec(String(timeLabel || ""));
  return match ? Number(match[1]) : null;
}

// Build a cumulative revenue-by-hour series for the owner dashboard chart from
// live data, so the area chart trends with real bookings instead of static
// sample numbers. Sessions seed a morning baseline; each booking lands in the
// bucket matching its preferred time. The final point equals the dashboard's
// "Revenue Today" metric (sessions + booking estimates).
export function buildRevenueSeries(bookings = [], sessions = []) {
  const perBucket = REVENUE_BUCKETS.map(() => 0);

  const sessionTotal = sessions.reduce((sum, session) => sum + (session.revenue || 0), 0);
  if (sessionTotal) {
    perBucket[0] += sessionTotal * 0.5;
    perBucket[1] += sessionTotal * 0.5;
  }

  bookings.forEach((booking) => {
    const hour = parseHour(booking.preferredTime);
    let index = REVENUE_BUCKETS.length - 1;
    if (hour != null) {
      index = 0;
      for (let i = 0; i < REVENUE_BUCKETS.length; i += 1) {
        if (hour >= REVENUE_BUCKETS[i].hour) index = i;
      }
    }
    perBucket[index] += booking.estimatedCost || 0;
  });

  let running = 0;
  return REVENUE_BUCKETS.map((bucket, i) => {
    running += perBucket[i];
    return { time: bucket.label, revenue: Math.round(running) };
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
