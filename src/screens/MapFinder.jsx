import { useEffect, useState } from "react";
import Icon from "../components/Icon";

function pinStyle(station) {
  if (!station.isOpen) return { bg: "bg-slate-muted", text: "text-slate-muted", icon: "block", label: "Off" };
  if (station.availablePorts === 0) return { bg: "bg-wait-amber", text: "text-wait-amber", icon: "ev_station", label: `${station.availablePorts}/${station.totalPorts}` };
  return { bg: "bg-primary", text: "text-primary", icon: "ev_station", label: `${station.availablePorts}/${station.totalPorts}` };
}

// Stitch "Map Station Finder" screen built from live station data.
export default function MapFinder({ stations, onReserve, focusStationId }) {
  const [selectedId, setSelectedId] = useState(focusStationId ?? stations[0]?.id ?? null);
  const selected = stations.find((station) => station.id === selectedId) || stations[0];

  // "Navigate" from My Bookings focuses the booked station on the map.
  useEffect(() => {
    if (focusStationId) setSelectedId(focusStationId);
  }, [focusStationId]);

  return (
    <div className="relative flex min-h-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface/95 px-margin-mobile shadow-sm backdrop-blur-md">
        <span className="font-display-lg text-[20px] tracking-tight text-primary">eVcN</span>
        <button type="button" className="flex h-10 w-10 items-center justify-center text-primary">
          <Icon name="bolt" />
        </button>
      </header>

      {/* Map canvas */}
      <div className="relative h-[420px] w-full shrink-0 overflow-hidden bg-surface-container">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(25,230,140,0.12),transparent_16rem),linear-gradient(to_right,#dbe2e6_1px,transparent_1px),linear-gradient(to_bottom,#dbe2e6_1px,transparent_1px)] bg-[size:100%_100%,38px_38px,38px_38px]" />

        {/* Route line */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" fill="none" viewBox="0 0 375 420">
          <path d="M187 360 Q 150 280, 240 220 T 110 120" stroke="url(#routegrad)" strokeLinecap="round" strokeWidth="4" strokeDasharray="10" />
          <defs>
            <linearGradient id="routegrad" gradientUnits="userSpaceOnUse" x1="187" x2="110" y1="360" y2="120">
              <stop stopColor="#19e68c" />
              <stop offset="1" stopColor="#006d3f" />
            </linearGradient>
          </defs>
        </svg>

        {/* Filter chips overlay */}
        <div className="absolute left-0 top-4 z-30 w-full px-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
            <button className="glass-card flex flex-none items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2 font-body-bold text-primary-container shadow-lg">
              <Icon name="flash_on" className="text-sm" /> Fast Charge
            </button>
            <button className="glass-card flex-none rounded-full border border-outline-variant/30 px-4 py-2 font-body-bold text-on-surface-variant shadow-sm">Open Now</button>
            <button className="glass-card flex-none rounded-full border border-outline-variant/30 px-4 py-2 font-body-bold text-on-surface-variant shadow-sm">4.5+ ★</button>
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-3">
          <button className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/20 text-on-surface shadow-lg">
            <Icon name="my_location" />
          </button>
          <button className="glass-card flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/20 text-on-surface shadow-lg">
            <Icon name="layers" />
          </button>
        </div>

        {/* Station pins */}
        {stations.map((station) => {
          const style = pinStyle(station);
          const isSelected = station.id === selected?.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => setSelectedId(station.id)}
              aria-label={`Select ${station.name}`}
              className={`absolute z-20 -translate-x-1/2 -translate-y-full ${station.isOpen ? "" : "opacity-60"}`}
              style={{ left: `${station.mapPosition.x}%`, top: `${station.mapPosition.y}%` }}
            >
              <div className={`flex flex-col items-center rounded-t-xl rounded-br-xl ${style.bg} p-2 text-white shadow-xl ${isSelected ? "ring-2 ring-white" : ""}`}>
                <Icon name={style.icon} fill className="text-sm" />
                <div className={`mt-0.5 rounded-full bg-white px-1 text-[10px] font-bold ${style.text}`}>{style.label}</div>
              </div>
              <div className={`mx-auto h-2 w-1 ${style.bg}`} />
            </button>
          );
        })}

        {/* User location */}
        <div className="absolute left-1/2 top-[86%] z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-12 w-12 animate-ping rounded-full bg-primary/20" />
            <div className="h-6 w-6 rounded-full border-2 border-white bg-primary shadow-lg" />
          </div>
        </div>
      </div>

      {/* Bottom sheet: nearest stations */}
      <div className="-mt-6 flex-1 rounded-t-[32px] bg-surface px-margin-mobile pt-3 shadow-[0px_-8px_40px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-outline-variant/30" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline-md text-[22px] text-on-surface">Nearest Stations</h2>
          <span className="font-body-bold text-sm text-primary">See all</span>
        </div>
        <div className="space-y-4 pb-6">
          {stations.map((station) => {
            const reservable = station.isOpen && station.availablePorts > 0;
            const percent = station.totalPorts ? Math.round((station.availablePorts / station.totalPorts) * 100) : 0;
            return (
              <div
                key={station.id}
                className={`glass-card relative overflow-hidden rounded-2xl border border-outline-variant/10 p-4 ${station.id === selected?.id ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-primary-container to-primary" />
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-body-bold text-lg text-on-surface">{station.name}</h3>
                    <p className="text-sm text-slate-muted">{station.location} • {station.distanceKm}km</p>
                  </div>
                  <div className={`flex items-center gap-1 rounded-lg px-3 py-1 ${reservable ? "bg-primary/10 text-primary" : "bg-wait-amber/10 text-wait-amber"}`}>
                    <span className="font-stat-lg text-lg leading-none">{station.availablePorts}</span>
                    <span className="mt-1 font-label-caps text-[10px] opacity-80">FREE</span>
                  </div>
                </div>
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between font-label-caps text-[10px] uppercase tracking-wider text-slate-muted">
                    <span>Availability</span>
                    <span>{percent}% Free</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className={`h-full ${reservable ? "bg-gradient-to-r from-primary-container to-primary" : "bg-wait-amber"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!reservable}
                    onClick={() => onReserve(station)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-base py-3 font-body-bold text-white disabled:bg-surface-container-high disabled:text-slate-muted"
                  >
                    <Icon name="near_me" className="text-sm" />
                    {reservable ? "Reserve" : "Unavailable"}
                  </button>
                  <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface-variant">
                    <Icon name="bookmark" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
