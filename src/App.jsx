import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bot,
  CalendarCheck,
  Bike,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Navigation,
  PlugZap,
  Plus,
  Power,
  Radio,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  bookings as seedBookings,
  chargers as seedChargers,
  revenueData,
  sessions,
  stations as seedStations,
  timeSlots,
} from "./data/mockData";
import {
  createBooking,
  createCharger,
  estimateCharging,
  formatVnd,
  loadSavedBookings,
  loadSavedNetworkState,
  saveBookings,
  saveNetworkState,
  syncStationPorts,
  updateStationAvailability,
} from "./lib/booking";
import { ASSISTANT_INTRO_MESSAGE, buildOwnerInsights, converse, createSlots } from "./lib/assistant";

const navItems = [
  { id: "driver", label: "Driver App", icon: Navigation },
  { id: "dashboard", label: "Station Owner Dashboard", icon: LayoutDashboard },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
];

const filterOptions = [
  { id: "fast", label: "Fast charging" },
  { id: "cheapest", label: "Cheapest" },
  { id: "available", label: "Available now" },
  { id: "closest", label: "Closest" },
];

const exampleQueries = [
  "Find me the nearest fast charger",
  "Which charger is cheapest?",
  "I need to charge near District 1 before 6pm",
  "Can I charge to 80% in under 45 minutes?",
  "Show station owner insights",
];

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-sky-50 text-sky-800 border-sky-200 shadow-sky-100",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-200 shadow-amber-100",
    red: "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200 shadow-slate-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone = "blue" }) {
  const colors = tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-sky-50 text-sky-700 ring-sky-100";
  return (
    <article className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ring-8 ${colors}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {helper ? <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p> : null}
    </article>
  );
}

function App() {
  const [activeView, setActiveView] = useState("driver");
  const [stations, setStations] = useState(() => loadSavedNetworkState("evcn-stations", seedStations));
  const [bookings, setBookings] = useState(() => loadSavedBookings(seedBookings));
  const [chargers, setChargers] = useState(() => loadSavedNetworkState("evcn-chargers", seedChargers));
  const [selectedStation, setSelectedStation] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);
  const [filters, setFilters] = useState({
    fast: false,
    cheapest: false,
    available: false,
    closest: false,
  });
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: ASSISTANT_INTRO_MESSAGE,
    },
  ]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [assistantSlots, setAssistantSlots] = useState(createSlots);
  const responseTimeoutRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(responseTimeoutRef.current);
  }, []);

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    saveNetworkState("evcn-stations", stations);
  }, [stations]);

  useEffect(() => {
    saveNetworkState("evcn-chargers", chargers);
  }, [chargers]);

  // Chargers are the source of truth for ports: whenever owner actions change a
  // charger, re-derive each station's available/total ports so rider-facing data
  // (Driver App, Booking modal, Copilot) stays in sync. No-op guard avoids loops.
  useEffect(() => {
    setStations((current) => {
      const synced = syncStationPorts(current, chargers);
      const changed = synced.some(
        (station, index) =>
          station.availablePorts !== current[index].availablePorts || station.totalPorts !== current[index].totalPorts
      );
      return changed ? synced : current;
    });
  }, [chargers]);

  const stationMap = useMemo(() => Object.fromEntries(stations.map((station) => [station.id, station])), [stations]);

  const filteredStations = useMemo(() => {
    let list = [...stations];
    if (filters.fast) {
      list = list.filter((station) => station.chargerType === "Fast" || station.chargerType === "Ultra-fast");
    }
    if (filters.available) {
      list = list.filter((station) => station.isOpen && station.availablePorts > 0);
    }
    if (filters.cheapest) {
      list.sort((a, b) => a.pricePerKwh - b.pricePerKwh);
    } else if (filters.closest) {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return list;
  }, [filters, stations]);

  const dashboardMetrics = useMemo(() => {
    const totalChargers = chargers.length;
    const availableChargers = chargers.filter((charger) => charger.status === "Available").length;
    const activeSessions = sessions.length;
    const revenueToday = sessions.reduce((sum, session) => sum + session.revenue, 0) + bookings.reduce((sum, booking) => sum + (booking.estimatedCost || 0), 0);
    const unavailable = chargers.filter((charger) => charger.status !== "Available").length;
    const utilization = totalChargers ? Math.round((unavailable / totalChargers) * 100) : 0;
    const faults = chargers.filter((charger) => charger.status === "Faulty").length;
    return { totalChargers, availableChargers, activeSessions, revenueToday, utilization, faults };
  }, [bookings, chargers]);

  const ownerInsights = useMemo(() => buildOwnerInsights(stations, chargers), [stations, chargers]);

  function openBooking(station) {
    setSuccessBooking(null);
    setSelectedStation(station);
  }

  function closeBooking() {
    setSelectedStation(null);
    setSuccessBooking(null);
  }

  function handleConfirmBooking(formData) {
    const booking = createBooking({
      station: selectedStation,
      ...formData,
    });
    setBookings((current) => [booking, ...current]);
    setStations((current) => updateStationAvailability(current, selectedStation.id));
    setChargers((current) => {
      let updatedOne = false;
      return current.map((charger) => {
        if (!updatedOne && charger.stationId === selectedStation.id && charger.status === "Available") {
          updatedOne = true;
          return { ...charger, status: "Reserved", currentUser: booking.customerName };
        }
        return charger;
      });
    });
    setSuccessBooking(booking);
  }

  function handleAssistantQuery(query) {
    window.clearTimeout(responseTimeoutRef.current);
    setIsAssistantTyping(true);
    setMessages((current) => [
      ...current,
      { role: "user", text: query },
    ]);

    const response = converse(query, stations, assistantSlots);
    // A quick beat to acknowledge, a longer one to "check the stations".
    const delay = response.kind === "recommendation" ? 700 : 400;

    responseTimeoutRef.current = window.setTimeout(() => {
      setAssistantSlots(response.slots);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: response.message,
          kind: response.kind,
          intent: response.intent,
          needSummary: response.needSummary,
          reason: response.reason,
          station: response.station,
          canReserve: response.canReserve,
          currentBattery: response.currentBattery,
          targetBattery: response.targetBattery,
          kwhNeeded: response.kwhNeeded,
          durationMinutes: response.durationMinutes,
          estimatedCost: response.estimatedCost,
          insights: response.insights,
          quickReplies: response.quickReplies,
        },
      ]);
      setIsAssistantTyping(false);
    }, delay);
  }

  // --- Owner actions: mutate shared state; the sync effect + rider views propagate them.
  function toggleStationOpen(stationId) {
    setStations((current) =>
      current.map((station) => (station.id === stationId ? { ...station, isOpen: !station.isOpen } : station))
    );
  }

  function setStationPrice(stationId, price) {
    const value = Math.max(0, Math.round(Number(price) || 0));
    setStations((current) =>
      current.map((station) => (station.id === stationId ? { ...station, pricePerKwh: value } : station))
    );
  }

  function setChargerStatus(chargerId, status) {
    setChargers((current) =>
      current.map((charger) => {
        if (charger.id !== chargerId) return charger;
        const reset = status === "Available";
        return {
          ...charger,
          status,
          currentUser: reset ? "-" : charger.currentUser,
          sessionMinutes: reset ? 0 : charger.sessionMinutes,
        };
      })
    );
  }

  function addCharger(station) {
    setChargers((current) => [...current, createCharger(station, current)]);
  }

  function removeCharger(chargerId) {
    setChargers((current) => current.filter((charger) => charger.id !== chargerId));
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-white/80 bg-white/90 px-4 py-4 shadow-soft ring-1 ring-slate-200/70 backdrop-blur-xl sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-sky-700 to-emerald-500 text-white shadow-soft">
              <PlugZap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-slate-950">eVcN</p>
              <p className="text-sm text-slate-500">AI electric motorcycle charging network</p>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/80 p-1 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-transparent bg-transparent text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeView === "driver" ? (
          <DriverApp
            filters={filters}
            setFilters={setFilters}
            stations={filteredStations}
            allStations={stations}
            onReserve={openBooking}
          />
        ) : null}
        {activeView === "dashboard" ? (
          <Dashboard
            stations={stations}
            metrics={dashboardMetrics}
            chargers={chargers}
            bookings={bookings}
            insights={ownerInsights}
            onToggleStation={toggleStationOpen}
            onSetPrice={setStationPrice}
            onSetChargerStatus={setChargerStatus}
            onAddCharger={addCharger}
            onRemoveCharger={removeCharger}
          />
        ) : null}
        {activeView === "assistant" ? (
          <Assistant messages={messages} isTyping={isAssistantTyping} onAsk={handleAssistantQuery} onReserve={openBooking} />
        ) : null}
        {activeView === "bookings" ? <Bookings bookings={bookings} stationMap={stationMap} /> : null}

        <DemoScript />
      </main>

      {selectedStation ? (
        <BookingModal
          station={selectedStation}
          successBooking={successBooking}
          onClose={closeBooking}
          onConfirm={handleConfirmBooking}
        />
      ) : null}
    </div>
  );
}

function DriverApp({ filters, setFilters, stations, allStations, onReserve }) {
  const bestStation = allStations.find((station) => station.id === "station-d1") || allStations[0];
  return (
    <section className="space-y-7">
      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-lift sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.35),transparent_28rem),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.28),transparent_22rem)]" />
          <div className="absolute -right-20 bottom-8 h-56 w-56 rounded-full border border-white/10 bg-white/5 blur-sm" />
          <div className="relative max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">Live HCMC rider network</Badge>
              <Badge tone="blue">Mock AI routing</Badge>
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Find and reserve electric motorcycle charging in seconds
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Compare nearby motorcycle charging stations by speed, availability, distance, price, and wait time. Reserve a charger before you arrive.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onReserve(bestStation)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-all duration-200 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <BatteryCharging className="h-4 w-4" aria-hidden="true" />
                Reserve District 1
              </button>
              <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur">
                <Route className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                1.2 km nearest hub
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MiniMetric value="5" label="HCMC stations" />
              <MiniMetric value="20" label="Network chargers" />
              <MiniMetric value="0-18m" label="Wait time range" />
            </div>
          </div>
        </div>
        <MapPanel stations={allStations} />
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">Nearby charging stations</h2>
          <p className="text-sm leading-6 text-slate-600">Compare route-ready hubs by distance, availability, price, and charging speed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setFilters((current) => ({ ...current, [filter.id]: !current[filter.id] }))}
              className={`min-h-11 cursor-pointer rounded-2xl border px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                filters[filter.id]
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {stations.map((station) => (
          <StationCard key={station.id} station={station} onReserve={onReserve} />
        ))}
      </div>
    </section>
  );
}

function MiniMetric({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{label}</p>
    </div>
  );
}

function MapPanel({ stations }) {
  return (
    <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-soft ring-1 ring-slate-200/70 backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.16),transparent_18rem),linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:100%_100%,44px_44px,44px_44px]" />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">Mock city grid</p>
          <h3 className="font-display text-xl font-bold text-slate-950">Ho Chi Minh City</h3>
        </div>
        <Badge tone="blue">Live pins</Badge>
      </div>
      <div className="relative z-10 h-64">
        {stations.map((station) => (
          <div
            key={station.id}
            className="absolute"
            style={{ left: `${station.mapPosition.x}%`, top: `${station.mapPosition.y}%` }}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-soft ring-4 ${station.isOpen ? "bg-emerald-500 ring-emerald-500/15" : "bg-slate-700 ring-slate-400/20"}`}>
              <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="mt-1 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-2 py-1 text-xs font-bold text-slate-700 shadow-sm">
              {station.district}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StationCard({ station, onReserve }) {
  const isReservable = station.isOpen && station.availablePorts > 0;
  const availabilityPercent = station.totalPorts ? Math.round((station.availablePorts / station.totalPorts) * 100) : 0;
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <div className="mb-5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-600" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <PlugZap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight text-slate-950">{station.name}</h3>
            <Badge tone={station.isOpen ? "green" : "slate"}>{station.isOpen ? "Open" : "Closed"}</Badge>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {station.location}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
          <Star className="h-4 w-4 fill-current" aria-hidden="true" />
          {station.rating}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoTile label="Distance" value={`${station.distanceKm} km`} icon={Navigation} />
        <InfoTile label="Type" value={station.chargerType} icon={Zap} />
        <InfoTile label="Ports" value={`${station.availablePorts}/${station.totalPorts}`} icon={PlugZap} />
        <InfoTile label="Wait" value={`${station.waitMinutes} min`} icon={Clock} />
      </div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">Port availability</span>
          <span className="font-bold text-slate-950">{availabilityPercent}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300" style={{ width: `${availabilityPercent}%` }} />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Price per kWh</p>
          <p className="font-display text-2xl font-bold tracking-tight text-slate-950">{formatVnd(station.pricePerKwh)}</p>
        </div>
        <button
          type="button"
          disabled={!isReservable}
          onClick={() => onReserve(station)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-sky-600 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-100 disabled:shadow-none"
        >
          <BatteryCharging className="h-4 w-4" aria-hidden="true" />
          Reserve Charger
        </button>
      </div>
    </article>
  );
}

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <Icon className="h-4 w-4 text-sky-600" aria-hidden="true" />
      <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function BookingModal({ station, successBooking, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [form, setForm] = useState({
    vehicleModel: "VinFast Feliz S",
    currentBattery: 30,
    targetBattery: 80,
    preferredTime: "17:30",
    customerName: "Demo Driver",
    phone: "0901234567",
  });
  const [error, setError] = useState("");
  const estimate = estimateCharging({
    station,
    currentBattery: form.currentBattery,
    targetBattery: form.targetBattery,
    chargerType: station.chargerType,
  });

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, []);

  function handleDialogKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const currentBattery = Number(form.currentBattery);
    const targetBattery = Number(form.targetBattery);
    const vehicleModel = form.vehicleModel.trim();
    const customerName = form.customerName.trim();
    const phone = form.phone.trim();

    if (!vehicleModel || !customerName || !phone) {
      setError("Please complete motorcycle, name, and phone details.");
      return;
    }
    if (!/^[0-9+() .-]{8,}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (targetBattery <= currentBattery) {
      setError("Target battery must be higher than current battery.");
      return;
    }
    onConfirm(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Reserve charger"
        aria-describedby={error ? "booking-error" : undefined}
        onKeyDown={handleDialogKeyDown}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white shadow-lift"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 p-5">
          <div className="flex gap-4">
            <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white sm:flex">
              <BatteryCharging className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">Selected station</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950">{station.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{station.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="green">{station.chargerType}</Badge>
                <Badge tone="blue">{station.availablePorts}/{station.totalPorts} ports</Badge>
                <Badge tone="slate">{formatVnd(station.pricePerKwh)} / kWh</Badge>
              </div>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close booking modal"
            onClick={onClose}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {successBooking ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold text-slate-950">Booking confirmed</h3>
            <p className="mt-2 text-slate-600">
              Booking ID <span className="font-bold text-slate-950">{successBooking.id}</span> is now visible in Bookings and Station Dashboard.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-11 cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 p-5 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-4">
              {error ? (
                <div id="booking-error" role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Motorcycle model" value={form.vehicleModel} onChange={(value) => updateField("vehicleModel", value)} />
                <Field label="Name" value={form.customerName} onChange={(value) => updateField("customerName", value)} />
                <Field label="Phone number" value={form.phone} onChange={(value) => updateField("phone", value)} />
                <label htmlFor="preferred-time" className="block">
                  <span className="text-sm font-semibold text-slate-700">Preferred time</span>
                  <select
                    id="preferred-time"
                    value={form.preferredTime}
                    onChange={(event) => updateField("preferredTime", event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-950 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Current battery %" type="number" value={form.currentBattery} onChange={(value) => updateField("currentBattery", value)} />
                <Field label="Target battery %" type="number" value={form.targetBattery} onChange={(value) => updateField("targetBattery", value)} />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:shadow-lift focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Confirm booking
              </button>
            </div>
            <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Live estimate</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">Charging estimate</h3>
              <div className="mt-4 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Estimated cost</p>
                <p className="mt-1 font-display text-3xl font-bold">{formatVnd(estimate.estimatedCost)}</p>
              </div>
              <div className="mt-4 space-y-3">
                <EstimateRow label="Charger type" value={station.chargerType} dark />
                <EstimateRow label="Price per kWh" value={formatVnd(station.pricePerKwh)} dark />
                <EstimateRow label="Available ports" value={`${station.availablePorts}/${station.totalPorts}`} dark />
                <EstimateRow label="kWh needed" value={`${estimate.kwhNeeded} kWh`} dark />
                <EstimateRow label="Charging duration" value={`${estimate.durationMinutes} min`} dark />
              </div>
            </aside>
          </form>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        id={id}
        type={type}
        required
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 100 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-950 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function EstimateRow({ label, value, dark = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0 ${dark ? "border-white/10" : "border-slate-200"}`}>
      <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</span>
      <span className={`text-sm font-bold ${dark ? "text-white" : "text-slate-950"}`}>{value}</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3" aria-live="polite">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="rounded-[1.35rem] rounded-bl-md border border-white/10 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">eVcN Copilot is thinking</span>
          <span className="flex gap-1" aria-hidden="true">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

function AssistantMessageCard({ message, onReserve }) {
  if (message.insights?.length) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 text-slate-900">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Owner insights</p>
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {message.insights.map((insight) => (
            <li key={insight} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!message.station || !message.canReserve) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recommended station</p>
            <p className="mt-1 font-display text-lg font-bold tracking-tight text-slate-950">{message.station.name}</p>
          </div>
          <Badge tone="green">{message.station.chargerType}</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message.reason}</p>
      </div>
      <div className="grid gap-2 p-4 text-sm sm:grid-cols-2">
        <span className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">
          {message.durationMinutes} min estimate
        </span>
        <span className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">
          {formatVnd(message.estimatedCost)}
        </span>
        <span className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">
          {message.kwhNeeded} kWh needed
        </span>
        <span className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">
          {message.station.availablePorts} ports available
        </span>
      </div>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onReserve(message.station)}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-emerald-600 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Reserve recommended charger
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message, onReserve, onAsk, isLast = false, isTyping = false }) {
  const isUser = message.role === "user";
  const showQuickReplies = !isUser && isLast && Boolean(message.quickReplies?.length);

  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
      <div className={`max-w-[88%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-[1.35rem] px-4 py-3 shadow-sm ${
            isUser
              ? "rounded-br-md bg-sky-500 text-white"
              : "rounded-bl-md border border-white/10 bg-white text-slate-800"
          }`}
        >
          {!isUser && message.needSummary ? (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{message.needSummary}</p>
          ) : null}
          <p className="text-sm leading-6">{message.text}</p>
          {!isUser ? <AssistantMessageCard message={message} onReserve={onReserve} /> : null}
        </div>
        {showQuickReplies ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={isTyping}
                onClick={() => onAsk(reply)}
                className="cursor-pointer rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition-colors duration-200 hover:bg-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white ring-1 ring-sky-300/40">
          <Bike className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

function Assistant({ messages, isTyping, onAsk, onReserve }) {
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  function submit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    onAsk(query.trim());
    setQuery("");
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr]">
      <div className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-emerald-500 text-white shadow-soft">
          <Bot className="h-7 w-7" aria-hidden="true" />
        </div>
        <Badge tone="blue">Rule-based mock AI</Badge>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-950">AI Assistant</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          A mobility charging consultant for electric motorcycle riders. Ask about speed, price, availability, location, and charging time. The POC uses local logic only.
        </p>
        <div className="mt-6 space-y-2">
          {exampleQueries.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={isTyping}
              onClick={() => onAsk(sample)}
              className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-none"
            >
              <MessageSquare className="h-4 w-4 text-sky-600" aria-hidden="true" />
              {sample}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-[640px] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-lift">
        <div className="flex min-h-0 w-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Cpu className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold">eVcN Copilot</p>
                <p className="text-xs text-slate-400">Motorcycle station recommendation engine</p>
              </div>
            </div>
            <Badge tone="green">Online</Badge>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.18),transparent_22rem),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_18rem)] p-4 sm:p-5">
            {messages.map((message, index) => (
              <ChatBubble
                key={`${message.role}-${index}`}
                message={message}
                onReserve={onReserve}
                onAsk={onAsk}
                isLast={index === messages.length - 1}
                isTyping={isTyping}
              />
            ))}
            {isTyping ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 border-t border-white/10 bg-white p-4 sm:flex-row sm:p-5">
            <label htmlFor="assistant-query" className="sr-only">Ask the AI Assistant</label>
            <input
              id="assistant-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask about motorcycle charging near District 1..."
              disabled={isTyping}
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-950 transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={isTyping || !query.trim()}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-sky-700 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ask
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  stations,
  metrics,
  chargers,
  bookings,
  insights,
  onToggleStation,
  onSetPrice,
  onSetChargerStatus,
  onAddCharger,
  onRemoveCharger,
}) {
  const liveUtilization = stations.map((station) => {
    const own = chargers.filter((charger) => charger.stationId === station.id);
    const total = own.length;
    const inUse = own.filter((charger) => charger.status !== "Available").length;
    return {
      station: station.district.replace("District ", "D"),
      utilization: total ? Math.round((inUse / total) * 100) : 0,
    };
  });

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-lift">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="green">Owner operations</Badge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Station Owner Dashboard</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Monitor and manage your electric motorcycle network — open or close stations, tune pricing, and handle chargers. Every change flows live to riders.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <MiniMetric value={`${metrics.utilization}%`} label="Utilization" />
            <MiniMetric value={metrics.activeSessions} label="Live sessions" />
            <MiniMetric value={metrics.faults} label="Faults" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={PlugZap} label="Total chargers" value={metrics.totalChargers} />
        <StatCard icon={CheckCircle2} label="Available chargers" value={metrics.availableChargers} tone="green" />
        <StatCard icon={Activity} label="Active sessions" value={metrics.activeSessions} />
        <StatCard icon={WalletCards} label="Revenue today" value={formatVnd(metrics.revenueToday)} helper="Includes confirmed reservations" tone="green" />
        <StatCard icon={Gauge} label="Utilization rate" value={`${metrics.utilization}%`} />
        <StatCard icon={AlertTriangle} label="Fault alerts" value={metrics.faults} tone="red" />
      </div>
      <StationControls
        stations={stations}
        onToggleStation={onToggleStation}
        onSetPrice={onSetPrice}
        onAddCharger={onAddCharger}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue today" summary="Mock eVcN motorcycle charging revenue across the day, peaking during the 5pm to 8pm evening rush.">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => formatVnd(value)} />
              <Area type="monotone" dataKey="revenue" stroke="#0EA5E9" fill="url(#revenue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Station utilization" summary="Live utilization per station (busy ports ÷ total ports). Updates as you change chargers.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={liveUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="station" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="utilization" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TableCard title="Charger status">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200">
                  <th scope="col" className="py-3">Charger ID</th>
                  <th scope="col">Station</th>
                  <th scope="col">Type</th>
                  <th scope="col">Status</th>
                  <th scope="col">Current user</th>
                  <th scope="col">Session time</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargers.map((charger) => (
                  <tr key={charger.id} className="transition-colors duration-200 hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-950">{charger.id}</td>
                    <td>{charger.station}</td>
                    <td>{charger.type}</td>
                    <td><StatusBadge status={charger.status} /></td>
                    <td>{charger.currentUser}</td>
                    <td>{charger.sessionMinutes ? `${charger.sessionMinutes} min` : "-"}</td>
                    <td className="py-2 text-right">
                      <ChargerActions
                        charger={charger}
                        onSetChargerStatus={onSetChargerStatus}
                        onRemoveCharger={onRemoveCharger}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
        <AIInsights insights={insights} />
      </div>
      <BookingsTable bookings={bookings.slice(0, 8)} title="Recent bookings" />
    </section>
  );
}

function StationControls({ stations, onToggleStation, onSetPrice, onAddCharger }) {
  return (
    <TableCard title="Station controls">
      <p className="-mt-2 mb-4 text-sm leading-6 text-slate-600">
        Open or close stations, tune price per kWh, and add chargers. Changes flow straight to the Driver App and the AI assistant.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th scope="col" className="py-3">Station</th>
              <th scope="col">Status</th>
              <th scope="col">Price / kWh (VND)</th>
              <th scope="col">Ports</th>
              <th scope="col" className="text-right">Chargers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stations.map((station) => (
              <tr key={station.id} className="transition-colors duration-200 hover:bg-slate-50">
                <td className="py-3">
                  <p className="font-semibold text-slate-950">{station.name}</p>
                  <p className="text-xs text-slate-500">{station.district}</p>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onToggleStation(station.id)}
                    aria-pressed={station.isOpen}
                    aria-label={`${station.isOpen ? "Close" : "Open"} ${station.name}`}
                    className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                      station.isOpen
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden="true" />
                    {station.isOpen ? "Open" : "Closed"}
                  </button>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={station.pricePerKwh}
                    onChange={(event) => onSetPrice(station.id, event.target.value)}
                    aria-label={`Price per kWh for ${station.name}`}
                    className="min-h-9 w-28 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-950 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </td>
                <td className="font-semibold text-slate-700">
                  {station.availablePorts}/{station.totalPorts}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onAddCharger(station)}
                    className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors duration-200 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add charger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

function ActionButton({ tone, icon: Icon, label, onClick }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    blue: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
    red: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${tones[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function ChargerActions({ charger, onSetChargerStatus, onRemoveCharger }) {
  const isFaulty = charger.status === "Faulty";
  const isBusy = charger.status === "In Use" || charger.status === "Reserved";
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {isFaulty ? (
        <ActionButton tone="green" icon={CheckCircle2} label="Fix" onClick={() => onSetChargerStatus(charger.id, "Available")} />
      ) : (
        <ActionButton tone="amber" icon={AlertTriangle} label="Fault" onClick={() => onSetChargerStatus(charger.id, "Faulty")} />
      )}
      {isBusy ? (
        <ActionButton tone="blue" icon={Zap} label="Free" onClick={() => onSetChargerStatus(charger.id, "Available")} />
      ) : null}
      <ActionButton tone="red" icon={Trash2} label="Remove" onClick={() => onRemoveCharger(charger.id)} />
    </div>
  );
}

function ChartCard({ title, summary, children }) {
  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition-all duration-200 hover:shadow-soft">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      </div>
      {summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p> : null}
      <div className="mt-4">{children}</div>
    </article>
  );
}

function TableCard({ title, children }) {
  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function StatusBadge({ status }) {
  const tone = status === "Available" ? "green" : status === "Faulty" ? "red" : status === "Reserved" ? "amber" : "blue";
  const icons = {
    Available: CheckCircle2,
    Faulty: AlertTriangle,
    Reserved: CalendarCheck,
    "In Use": Activity,
  };
  const Icon = icons[status] || Radio;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <Badge tone={tone}>{status}</Badge>
    </span>
  );
}

function AIInsights({ insights }) {
  return (
    <aside className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-lift">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-300">AI insights</p>
          <h2 className="font-display text-xl font-bold">Owner suggestions</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-100 transition-colors duration-200 hover:bg-white/15">
            {insight}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Bookings({ bookings }) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-soft ring-1 ring-slate-200/70 backdrop-blur">
        <Badge tone="blue">Local reservations</Badge>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950">Bookings</h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Confirmed motorcycle charging reservations are stored locally and shown across the POC.</p>
      </div>
      <BookingsTable bookings={bookings} title="All bookings" />
    </section>
  );
}

function BookingsTable({ bookings, title }) {
  return (
    <TableCard title={title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr className="border-b border-slate-200">
              <th scope="col" className="py-3">Customer name</th>
              <th scope="col">Motorcycle</th>
              <th scope="col">Station</th>
              <th scope="col">Time</th>
              <th scope="col">Estimated cost</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="transition-colors duration-200 hover:bg-slate-50">
                <td className="py-3">
                  <p className="font-semibold text-slate-950">{booking.customerName}</p>
                  <p className="text-xs text-slate-500">{booking.phone}</p>
                </td>
                <td>{booking.vehicleModel}</td>
                <td>{booking.stationName}</td>
                <td>{booking.preferredTime}</td>
                <td>{formatVnd(booking.estimatedCost)}</td>
                <td><StatusBadge status={booking.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableCard>
  );
}

function DemoScript() {
  const steps = [
    "Open Driver App",
    "Ask AI: I need to charge near District 1 before 6pm",
    "Reserve the recommended charger",
    "Enter motorcycle and battery details",
    "Confirm booking",
    "Open Station Dashboard",
    "Show that booking and revenue updated",
  ];
  return (
    <section className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700 ring-8 ring-sky-100/70">
          <Bike className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-700">Demo script</p>
          <h2 className="font-display text-xl font-bold text-slate-950">Run the POC in one browser</h2>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition-colors duration-200 hover:bg-white">
            <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default App;
