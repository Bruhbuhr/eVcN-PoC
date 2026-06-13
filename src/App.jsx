import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./components/Icon";
import MobileShell from "./components/MobileShell";
import RiderHome from "./screens/RiderHome";
import MapFinder from "./screens/MapFinder";
import CopilotChat from "./screens/CopilotChat";
import ReserveCharger from "./screens/ReserveCharger";
import BookingConfirmed from "./screens/BookingConfirmed";
import MyBookings from "./screens/MyBookings";
import OwnerDashboard from "./screens/OwnerDashboard";
import {
  bookings as seedBookings,
  chargers as seedChargers,
  sessions,
  stations as seedStations,
} from "./data/mockData";
import {
  createBooking,
  createCharger,
  loadSavedBookings,
  loadSavedNetworkState,
  saveBookings,
  saveNetworkState,
  syncStationPorts,
  updateStationAvailability,
} from "./lib/booking";
import { ASSISTANT_INTRO_MESSAGE, buildOwnerInsights, converse, createSlots } from "./lib/assistant";

function App() {
  const [mode, setMode] = useState("rider"); // "rider" | "owner"
  const [activeView, setActiveView] = useState("home"); // home | map | copilot | bookings
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
  const [messages, setMessages] = useState([{ role: "assistant", text: ASSISTANT_INTRO_MESSAGE }]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [assistantSlots, setAssistantSlots] = useState(createSlots);
  const responseTimeoutRef = useRef(null);

  useEffect(() => () => window.clearTimeout(responseTimeoutRef.current), []);
  useEffect(() => saveBookings(bookings), [bookings]);
  useEffect(() => saveNetworkState("evcn-stations", stations), [stations]);
  useEffect(() => saveNetworkState("evcn-chargers", chargers), [chargers]);

  // Chargers are the source of truth for ports: whenever owner actions change a
  // charger, re-derive each station's available/total ports so rider-facing data
  // (Home, Reserve, Copilot, Map) stays in sync. No-op guard avoids loops.
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
    const revenueToday =
      sessions.reduce((sum, session) => sum + session.revenue, 0) +
      bookings.reduce((sum, booking) => sum + (booking.estimatedCost || 0), 0);
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

  // Bottom-nav navigation always leaves any in-progress reserve/confirm flow.
  function navigate(tab) {
    setSelectedStation(null);
    setSuccessBooking(null);
    setActiveView(tab);
  }

  function handleConfirmBooking(formData) {
    const booking = createBooking({ station: selectedStation, ...formData });
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
    setMessages((current) => [...current, { role: "user", text: query }]);

    const response = converse(query, stations, assistantSlots);
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

  function renderRiderScreen() {
    if (successBooking) {
      return (
        <BookingConfirmed
          booking={successBooking}
          station={selectedStation}
          onViewBookings={() => navigate("bookings")}
          onDone={() => navigate("home")}
        />
      );
    }
    if (selectedStation) {
      return <ReserveCharger station={selectedStation} onConfirm={handleConfirmBooking} onBack={closeBooking} />;
    }
    if (activeView === "map") {
      return <MapFinder stations={stations} onReserve={openBooking} />;
    }
    if (activeView === "copilot") {
      return (
        <CopilotChat messages={messages} isTyping={isAssistantTyping} onAsk={handleAssistantQuery} onReserve={openBooking} />
      );
    }
    if (activeView === "bookings") {
      return <MyBookings bookings={bookings} stationMap={stationMap} />;
    }
    return (
      <RiderHome
        filters={filters}
        setFilters={setFilters}
        stations={filteredStations}
        onReserve={openBooking}
        onOpenCopilot={() => navigate("copilot")}
        onOpenMap={() => navigate("map")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top-level Rider / Owner switch */}
      <div className="sticky top-0 z-[60] border-b border-outline-variant/20 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-base text-primary-container">
              <Icon name="bolt" fill className="text-[20px]" />
            </div>
            <span className="font-display-lg text-[18px] tracking-tight text-primary">eVcN</span>
          </div>
          <div className="flex rounded-full bg-surface-container-high p-1">
            {[
              { id: "rider", label: "Rider App" },
              { id: "owner", label: "Owner Console" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-body-bold transition-colors ${
                  mode === option.id ? "bg-ink-base text-on-primary" : "text-on-surface-variant"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "owner" ? (
        <OwnerDashboard
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
      ) : (
        <>
          <MobileShell activeTab={activeView} onNavigate={navigate} hideNav={Boolean(successBooking)}>
            {renderRiderScreen()}
          </MobileShell>
          <DemoScript />
        </>
      )}
    </div>
  );
}

function DemoScript() {
  const steps = [
    "Open the Rider App home",
    "Tap the Copilot pill and ask: charge near District 1 before 6pm",
    "Reserve the recommended charger",
    "Enter motorcycle and battery details",
    "Confirm the booking",
    "Switch to Owner Console",
    "See the booking and revenue update",
  ];
  return (
    <section className="mx-auto mt-8 max-w-[760px] px-4 pb-12">
      <div className="glass-card rounded-2xl border border-outline-variant/20 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
            <Icon name="two_wheeler" fill className="text-[22px]" />
          </div>
          <div>
            <p className="font-label-caps text-[12px] uppercase tracking-[0.18em] text-primary">Demo script</p>
            <h2 className="font-headline-md text-[20px] text-on-surface">Run the POC in one browser</h2>
          </div>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-base text-xs font-bold text-on-primary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default App;
