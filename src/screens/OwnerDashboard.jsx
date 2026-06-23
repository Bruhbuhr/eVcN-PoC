import { useState } from "react";
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
import OwnerOnboarding from "./OwnerOnboarding";
import Icon from "../components/Icon";
import { buildRevenueSeries, formatVnd } from "../lib/booking";

// Sidebar links scroll to the matching dashboard section (no dead "#" anchors).
const sideLinks = [
  { icon: "dashboard", label: "Overview", target: "overview", active: true },
  { icon: "payments", label: "Revenue", target: "revenue" },
  { icon: "ev_station", label: "Stations", target: "stations" },
  { icon: "build", label: "Chargers", target: "chargers" },
  { icon: "psychology", label: "AI Insights", target: "insights" },
];

function scrollToSection(target) {
  if (typeof document === "undefined") return;
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function MetricCard({ icon, label, value, helper, accent }) {
  return (
    <div className={`glass-card rounded-xl p-lg ${accent ? "border-t-4 border-primary" : ""}`}>
      <div className="mb-xs flex items-center gap-xs text-on-surface-variant">
        <Icon name={icon} className="text-[20px]" />
        <span className="font-label-caps text-[12px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="font-stat-lg text-[30px] text-on-surface">{value}</div>
      {helper ? <div className="mt-xs text-sm text-on-surface-variant">{helper}</div> : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Available: { tone: "bg-primary/10 text-primary", icon: "check_circle" },
    Faulty: { tone: "bg-error-rose/10 text-error", icon: "warning" },
    Reserved: { tone: "bg-wait-amber/10 text-wait-amber", icon: "schedule" },
    "In Use": { tone: "bg-secondary-container/20 text-secondary", icon: "bolt" },
  };
  const config = map[status] || { tone: "bg-surface-container-high text-on-surface-variant", icon: "sensors" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${config.tone}`}>
      <Icon name={config.icon} fill className="text-[14px]" />
      {status}
    </span>
  );
}

function ActionButton({ tone, icon, label, onClick }) {
  const tones = {
    green: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
    amber: "border-wait-amber/40 bg-wait-amber/10 text-wait-amber hover:bg-wait-amber/20",
    blue: "border-secondary/30 bg-secondary-container/20 text-secondary hover:bg-secondary-container/30",
    red: "border-error-rose/40 bg-error-rose/10 text-error hover:bg-error-rose/20",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-body-bold transition-colors ${tones[tone]}`}
    >
      <Icon name={icon} className="text-[16px]" />
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
        <ActionButton tone="green" icon="check_circle" label="Fix" onClick={() => onSetChargerStatus(charger.id, "Available")} />
      ) : (
        <ActionButton tone="amber" icon="warning" label="Fault" onClick={() => onSetChargerStatus(charger.id, "Faulty")} />
      )}
      {isBusy ? <ActionButton tone="blue" icon="bolt" label="Free" onClick={() => onSetChargerStatus(charger.id, "Available")} /> : null}
      <ActionButton tone="red" icon="delete" label="Remove" onClick={() => onRemoveCharger(charger.id)} />
    </div>
  );
}

// Stitch "Station Owner Dashboard" (desktop), wired to live owner controls.
export default function OwnerDashboard({
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
  onCreateStation,
  revenueSeries,
}) {
  const [showAddStation, setShowAddStation] = useState(false);
  const revenueData = revenueSeries ?? buildRevenueSeries(bookings, []);
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
    <div className="bg-surface text-on-surface">
      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/95 shadow-sm backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-margin-desktop">
          <div className="flex items-center gap-xl">
            <span className="font-headline-md text-[24px] tracking-tight text-primary">eVcN Charging</span>
            <div className="hidden gap-lg md:flex">
              <button type="button" onClick={() => scrollToSection("overview")} className="border-b-2 border-primary pb-1 font-body-bold text-primary">Dashboard</button>
              <button type="button" onClick={() => scrollToSection("revenue")} className="font-body-base text-on-surface-variant transition-colors hover:text-primary">Analytics</button>
              <button type="button" onClick={() => scrollToSection("stations")} className="font-body-base text-on-surface-variant transition-colors hover:text-primary">Stations</button>
              <button type="button" onClick={() => scrollToSection("chargers")} className="font-body-base text-on-surface-variant transition-colors hover:text-primary">Chargers</button>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <Icon name="notifications" className="cursor-pointer p-sm text-on-surface-variant hover:text-primary" />
            <Icon name="settings" className="cursor-pointer p-sm text-on-surface-variant hover:text-primary" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-slate-muted">
              <Icon name="person" fill className="text-[18px]" />
            </div>
          </div>
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 flex-col gap-sm overflow-y-auto border-r border-outline-variant/20 bg-surface-container-lowest py-lg lg:flex">
          <div className="mb-lg px-md">
            <div className="rounded-xl bg-surface-container-low p-md">
              <h3 className="font-headline-md text-[18px] text-primary">Station Manager</h3>
              <p className="font-label-caps text-[12px] uppercase tracking-[0.18em] text-on-surface-variant opacity-70">Premium Tier</p>
            </div>
          </div>
          {sideLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => scrollToSection(link.target)}
              className={`mx-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                link.active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:translate-x-1 hover:bg-surface-container-high"
              }`}
            >
              <Icon name={link.icon} />
              <span className="font-body-base">{link.label}</span>
            </button>
          ))}
          <div className="mt-auto border-t border-outline-variant/20 pt-lg">
            <button
              type="button"
              onClick={() => setShowAddStation(true)}
              className="mx-md mb-lg w-4/5 rounded-full bg-primary px-lg py-sm font-body-bold text-on-primary transition-opacity hover:opacity-90"
            >
              Add New Station
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 bg-surface-bright p-margin-desktop">
          {/* Hero */}
          <section id="overview" className="relative mb-xl flex min-h-[220px] items-center overflow-hidden rounded-2xl bg-ink-base p-xl">
            <div className="relative z-10 flex w-full items-center justify-between text-white">
              <div className="max-w-md">
                <h1 className="mb-xs font-display-lg text-[36px]">System Pulse</h1>
                <p className="text-text-light opacity-80">Real-time performance metrics for your Ho Chi Minh City network.</p>
              </div>
              <div className="hidden gap-xl text-center sm:flex">
                <div>
                  <div className="font-display-lg text-[36px] text-primary-container">{metrics.utilization}%</div>
                  <div className="font-label-caps text-[12px] uppercase tracking-widest text-text-light/60">Utilization</div>
                </div>
                <div className="mx-md h-16 self-center border-l border-white/10" />
                <div>
                  <div className="flex items-center justify-center gap-xs font-display-lg text-[36px]">
                    {metrics.activeSessions}
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary-container" />
                  </div>
                  <div className="font-label-caps text-[12px] uppercase tracking-widest text-text-light/60">Live Sessions</div>
                </div>
                <div className="mx-md h-16 self-center border-l border-white/10" />
                <div>
                  <div className="font-display-lg text-[36px] text-error-rose">{metrics.faults}</div>
                  <div className="font-label-caps text-[12px] uppercase tracking-widest text-text-light/60">Faults</div>
                </div>
              </div>
            </div>
          </section>

          {/* Metric cards */}
          <div className="mb-xl grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard icon="payments" label="Revenue Today" value={formatVnd(metrics.revenueToday)} helper="Includes confirmed reservations" accent />
            <MetricCard icon="ev_station" label="Total Chargers" value={metrics.totalChargers} helper={`${metrics.availableChargers} available now`} />
            <MetricCard icon="bolt" label="Active Sessions" value={metrics.activeSessions} helper="Live across network" />
            <MetricCard icon="check_circle" label="Available Chargers" value={metrics.availableChargers} />
            <MetricCard icon="speed" label="Utilization Rate" value={`${metrics.utilization}%`} />
            <MetricCard icon="warning" label="Fault Alerts" value={metrics.faults} helper="Needs attention" />
          </div>

          {/* Charts + tables grid */}
          <div className="grid grid-cols-12 gap-xl">
            <div className="col-span-12 space-y-xl lg:col-span-8">
              {/* Charts */}
              <div id="revenue" className="grid grid-cols-1 gap-xl md:grid-cols-2">
                <div className="glass-card rounded-2xl p-lg">
                  <h3 className="mb-lg font-headline-md text-[18px]">Revenue Trends</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#19e68c" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#19e68c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
                      <YAxis tickFormatter={(value) => `${value / 1000}k`} stroke="#64748B" fontSize={12} />
                      <Tooltip formatter={(value) => formatVnd(value)} />
                      <Area type="monotone" dataKey="revenue" stroke="#006d3f" fill="url(#revenueFill)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-card rounded-2xl p-lg">
                  <h3 className="mb-lg font-headline-md text-[18px]">Station Utilization</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={liveUtilization}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" />
                      <XAxis dataKey="station" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="utilization" fill="#19e68c" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Station controls */}
              <div id="stations" className="glass-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-outline-variant/20 p-lg">
                  <h3 className="font-headline-md text-[20px]">Station Controls</h3>
                  <span className="text-sm text-on-surface-variant">Changes flow live to riders</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-surface-container-low font-label-caps text-[12px] uppercase tracking-[0.12em] text-on-surface-variant">
                      <tr>
                        <th className="px-lg py-md">Station</th>
                        <th className="px-lg py-md">District</th>
                        <th className="px-lg py-md">Status</th>
                        <th className="px-lg py-md">Price/kWh</th>
                        <th className="px-lg py-md text-right">Chargers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 font-body-base">
                      {stations.map((station) => (
                        <tr key={station.id} className="transition-colors hover:bg-surface-container-lowest">
                          <td className="px-lg py-md font-body-bold">{station.name}</td>
                          <td className="px-lg py-md text-on-surface-variant">{station.district}</td>
                          <td className="px-lg py-md">
                            <button
                              type="button"
                              onClick={() => onToggleStation(station.id)}
                              aria-pressed={station.isOpen}
                              aria-label={`${station.isOpen ? "Close" : "Open"} ${station.name}`}
                              className="inline-flex items-center gap-2"
                            >
                              <span className={`relative h-6 w-11 rounded-full transition-colors ${station.isOpen ? "bg-primary" : "bg-surface-variant"}`}>
                                <span className={`absolute top-[2px] h-5 w-5 rounded-full bg-white transition-all ${station.isOpen ? "left-[22px]" : "left-[2px]"}`} />
                              </span>
                              <span className={`text-sm font-body-bold ${station.isOpen ? "text-primary" : "text-error"}`}>
                                {station.isOpen ? "Open" : "Closed"}
                              </span>
                            </button>
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-sm">
                              <input
                                type="number"
                                min={0}
                                step={100}
                                value={station.pricePerKwh}
                                onChange={(event) => onSetPrice(station.id, event.target.value)}
                                aria-label={`Price per kWh for ${station.name}`}
                                className="w-24 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-sm focus:ring-2 focus:ring-primary-container"
                              />
                              <span className="text-xs text-on-surface-variant">VND</span>
                            </div>
                          </td>
                          <td className="px-lg py-md text-right">
                            <button
                              type="button"
                              onClick={() => onAddCharger(station)}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface px-3 py-1.5 text-xs font-body-bold text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              <Icon name="add" className="text-[16px]" />
                              {station.availablePorts}/{station.totalPorts} · Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-12 space-y-xl lg:col-span-4">
              {/* AI insights */}
              <div id="insights" className="glass-card overflow-hidden rounded-2xl border-2 border-secondary-container/30">
                <div className="bg-gradient-to-br from-secondary to-on-secondary-container p-lg text-white">
                  <div className="mb-xs flex items-center gap-sm">
                    <Icon name="psychology" />
                    <h3 className="font-headline-md text-[18px]">AI Copilot Insights</h3>
                  </div>
                  <p className="text-sm opacity-80">Predictive analysis based on urban mobility patterns in HCMC.</p>
                </div>
                <div className="space-y-lg bg-surface p-lg">
                  {insights.map((insight) => (
                    <div key={insight} className="flex gap-md">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container/20 text-secondary">
                        <Icon name="trending_up" />
                      </div>
                      <p className="text-sm leading-relaxed text-on-surface-variant">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent bookings */}
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between border-b border-outline-variant/20 p-lg">
                  <h3 className="font-headline-md text-[18px]">Recent Bookings</h3>
                  <button type="button" onClick={() => scrollToSection("chargers")} className="font-label-caps text-[12px] uppercase tracking-[0.12em] text-primary">View all</button>
                </div>
                <div className="space-y-lg p-lg">
                  {bookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-slate-muted">
                          <Icon name="person" fill className="text-[20px]" />
                        </div>
                        <div>
                          <p className="font-body-bold text-sm">{booking.customerName}</p>
                          <p className="text-xs text-on-surface-variant">{booking.vehicleModel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-body-bold">{formatVnd(booking.estimatedCost)}</p>
                        <p className="text-xs text-on-surface-variant">{booking.preferredTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charger status (full width) */}
          <div id="chargers" className="glass-card mt-xl overflow-hidden rounded-2xl">
            <div className="border-b border-outline-variant/20 p-lg">
              <h3 className="font-headline-md text-[20px]">Charger Status</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-surface-container-low font-label-caps text-[12px] uppercase tracking-[0.12em] text-on-surface-variant">
                  <tr>
                    <th className="px-lg py-md">Charger ID</th>
                    <th className="px-lg py-md">Station</th>
                    <th className="px-lg py-md">Type</th>
                    <th className="px-lg py-md">Status</th>
                    <th className="px-lg py-md">Current user</th>
                    <th className="px-lg py-md">Session</th>
                    <th className="px-lg py-md text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {chargers.map((charger) => (
                    <tr key={charger.id} className="transition-colors hover:bg-surface-container-lowest">
                      <td className="whitespace-nowrap px-lg py-md font-body-bold">{charger.id}</td>
                      <td className="whitespace-nowrap px-lg py-md text-on-surface-variant">{charger.station}</td>
                      <td className="px-lg py-md text-on-surface-variant">{charger.type}</td>
                      <td className="px-lg py-md"><StatusBadge status={charger.status} /></td>
                      <td className="whitespace-nowrap px-lg py-md text-on-surface-variant">{charger.currentUser}</td>
                      <td className="whitespace-nowrap px-lg py-md text-on-surface-variant">{charger.sessionMinutes ? `${charger.sessionMinutes} min` : "-"}</td>
                      <td className="px-lg py-md text-right">
                        <ChargerActions charger={charger} onSetChargerStatus={onSetChargerStatus} onRemoveCharger={onRemoveCharger} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showAddStation ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-ink-base/60 backdrop-blur-sm">
          <div className="min-h-full bg-surface">
            <OwnerOnboarding
              variant="add"
              onCreateStation={onCreateStation}
              onComplete={() => setShowAddStation(false)}
              onCancel={() => setShowAddStation(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
