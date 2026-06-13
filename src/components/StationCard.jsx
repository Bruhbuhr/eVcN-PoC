import Icon from "./Icon";
import StatusPill from "./StatusPill";
import { formatVnd } from "../lib/booking";

// Stitch "Nearby Stations" card, bound to live station data.
export default function StationCard({ station, onReserve }) {
  const isReservable = station.isOpen && station.availablePorts > 0;
  const availabilityPercent = station.totalPorts
    ? Math.round((station.availablePorts / station.totalPorts) * 100)
    : 0;

  return (
    <article className="glass-card relative overflow-hidden rounded-3xl border border-outline-variant/10 shadow-sm transition-transform active:scale-[0.99]">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary-container to-secondary-container" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h3 className="font-body-bold text-[18px] text-on-surface">{station.name}</h3>
            <span className="font-body-base text-[12px] text-slate-muted">{station.location}</span>
          </div>
          <StatusPill station={station} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-2">
            <span className="font-label-caps text-[10px] uppercase text-slate-muted">Distance</span>
            <span className="font-body-bold text-on-surface">{station.distanceKm} km</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-2">
            <span className="font-label-caps text-[10px] uppercase text-slate-muted">Rating</span>
            <div className="flex items-center gap-1">
              <Icon name="star" fill className="text-[14px] text-wait-amber" />
              <span className="font-body-bold text-on-surface">{station.rating}</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-2">
            <span className="font-label-caps text-[10px] uppercase text-slate-muted">Wait</span>
            <span className="font-body-bold text-wait-amber">{station.waitMinutes} min</span>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-outline-variant/10 pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full bg-primary-container" style={{ width: `${availabilityPercent}%` }} />
              </div>
              <span className="font-body-bold text-[11px]">{station.availablePorts}/{station.totalPorts}</span>
              <span className="text-[11px] text-slate-muted">Available</span>
            </div>
            <span className="font-body-bold text-[16px] text-primary">
              {formatVnd(station.pricePerKwh)} <span className="font-body-base text-[11px] text-slate-muted">/kWh</span>
            </span>
          </div>
          <button
            type="button"
            disabled={!isReservable}
            onClick={() => onReserve(station)}
            className="h-12 rounded-2xl bg-primary-container px-6 font-body-bold text-on-primary-container shadow-md transition-all duration-150 hover:bg-primary-fixed-dim active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-slate-muted disabled:shadow-none"
          >
            Reserve
          </button>
        </div>
      </div>
    </article>
  );
}
