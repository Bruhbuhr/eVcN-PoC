import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./components/Icon";
import DemoScript from "./components/DemoScript";
import MobileShell from "./components/MobileShell";
import RiderHome from "./screens/RiderHome";
import MapFinder from "./screens/MapFinder";
import CopilotChat from "./screens/CopilotChat";
import ReserveCharger from "./screens/ReserveCharger";
import BookingConfirmed from "./screens/BookingConfirmed";
import MyBookings from "./screens/MyBookings";
import OwnerDashboard from "./screens/OwnerDashboard";
import OwnerOnboarding from "./screens/OwnerOnboarding";
import AuthScreen from "./screens/AuthScreen";
import useChargingNetwork from "./hooks/useChargingNetwork";
import { ASSISTANT_INTRO_MESSAGE, converse, createSlots } from "./lib/assistant";
import {
  createSupabaseBrowserClient,
  getSupabaseConfigStatus,
  loginWithEmail,
  registerWithEmail,
  signOutUser,
} from "./lib/auth";

function App() {
  const authConfigStatus = useMemo(() => getSupabaseConfigStatus(), []);
  const supabaseClient = useMemo(() => createSupabaseBrowserClient(), []);
  const [authLoading, setAuthLoading] = useState(authConfigStatus.isConfigured);
  const [authUser, setAuthUser] = useState(null);
  const [ownerOnboardingComplete, setOwnerOnboardingComplete] = useState(false);
  const [mode, setMode] = useState("rider"); // "rider" | "owner"
  const [activeView, setActiveView] = useState("home"); // home | map | copilot | bookings
  const [selectedStation, setSelectedStation] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);
  const [mapFocusId, setMapFocusId] = useState(null);
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

  // Charging network domain: stations, chargers, bookings + their mutations.
  const network = useChargingNetwork();
  const { stations, chargers, bookings, stationMap, metrics, insights, revenueSeries } = network;

  useEffect(() => () => window.clearTimeout(responseTimeoutRef.current), []);
  useEffect(() => {
    if (!supabaseClient) {
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;
    supabaseClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setAuthUser(null);
        } else {
          setAuthUser(data.session?.user ?? null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthUser(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setAuthLoading(false);
      });

    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [supabaseClient]);

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

  const authName = authUser?.user_metadata?.full_name || authUser?.email || "Rider";
  const authRole = authUser?.user_metadata?.role === "owner" ? "owner" : "driver";
  const canOpenOwnerConsole = authRole === "owner";
  const authRoleLabel = canOpenOwnerConsole ? "Owner account" : "Driver account";
  const allowedMode = canOpenOwnerConsole ? "owner" : "rider";
  const activeMode = authUser ? allowedMode : mode;
  const ownerOnboardingKey = authUser?.id ? `evcn-owner-onboarding:${authUser.id}` : null;

  useEffect(() => {
    if (authUser && mode !== allowedMode) {
      setMode(allowedMode);
    }
  }, [allowedMode, authUser, mode]);

  useEffect(() => {
    if (!authUser || authRole !== "owner" || !ownerOnboardingKey) {
      setOwnerOnboardingComplete(false);
      return;
    }
    setOwnerOnboardingComplete(localStorage.getItem(ownerOnboardingKey) === "complete");
  }, [authRole, authUser, ownerOnboardingKey]);

  async function handleLogin(formData) {
    const data = await loginWithEmail(supabaseClient, formData);
    setAuthUser(data.user ?? data.session?.user ?? null);
    return data;
  }

  async function handleRegister(formData) {
    const data = await registerWithEmail(supabaseClient, formData);
    if (data.session?.user) setAuthUser(data.session.user);
    return data;
  }

  async function handleSignOut() {
    await signOutUser(supabaseClient);
    setAuthUser(null);
    setOwnerOnboardingComplete(false);
    setMode("rider");
    navigate("home");
  }

  function handleCompleteOwnerOnboarding(profile) {
    if (ownerOnboardingKey) {
      localStorage.setItem(ownerOnboardingKey, "complete");
      localStorage.setItem(`${ownerOnboardingKey}:profile`, JSON.stringify(profile));
    }
    setOwnerOnboardingComplete(true);
  }

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

  // "Navigate" on a booking jumps to the Map tab with that station selected.
  function goToStationOnMap(station) {
    setSelectedStation(null);
    setSuccessBooking(null);
    setMapFocusId(station.id);
    setActiveView("map");
  }

  function handleConfirmBooking(formData) {
    const booking = network.confirmBooking(selectedStation, formData);
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
      return <MapFinder stations={stations} onReserve={openBooking} focusStationId={mapFocusId} />;
    }
    if (activeView === "copilot") {
      return (
        <CopilotChat messages={messages} isTyping={isAssistantTyping} onAsk={handleAssistantQuery} onReserve={openBooking} />
      );
    }
    if (activeView === "bookings") {
      return (
        <MyBookings
          bookings={bookings}
          stationMap={stationMap}
          onNavigate={goToStationOnMap}
          onCancel={network.cancelBooking}
        />
      );
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
          <div className="flex items-center gap-3">
            {authUser ? (
              <div className="hidden items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-sm text-on-surface-variant sm:flex">
                <Icon name="person" fill className="text-[18px]" />
                <span>{authName}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-body-bold text-primary">
                  {authRoleLabel}
                </span>
              </div>
            ) : null}
            <div className="flex rounded-full bg-surface-container-high p-1">
              {[
                { id: "rider", label: "Rider App" },
                { id: "owner", label: "Owner Console" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.id !== allowedMode) return;
                    setMode(option.id);
                  }}
                  disabled={!authUser || option.id !== allowedMode}
                  title={authUser && option.id !== allowedMode ? `${option.label} requires a ${option.id === "owner" ? "owner" : "driver"} account` : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm font-body-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeMode === option.id ? "bg-ink-base text-on-primary" : "text-on-surface-variant"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-sm font-body-bold text-on-surface-variant transition hover:bg-surface-container-high"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {authLoading ? (
        <div className="flex min-h-[calc(100vh-65px)] items-center justify-center text-on-surface-variant">
          Loading account...
        </div>
      ) : !authUser ? (
        <AuthScreen configStatus={authConfigStatus} onLogin={handleLogin} onRegister={handleRegister} />
      ) : activeMode === "owner" && !ownerOnboardingComplete ? (
        <OwnerOnboarding
          ownerName={authName}
          onCreateStation={network.addStation}
          onComplete={handleCompleteOwnerOnboarding}
        />
      ) : activeMode === "owner" ? (
        <OwnerDashboard
          stations={stations}
          metrics={metrics}
          chargers={chargers}
          bookings={bookings}
          insights={insights}
          revenueSeries={revenueSeries}
          onToggleStation={network.toggleStationOpen}
          onSetPrice={network.setStationPrice}
          onSetChargerStatus={network.setChargerStatus}
          onAddCharger={network.addCharger}
          onRemoveCharger={network.removeCharger}
          onCreateStation={network.addStation}
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

export default App;
