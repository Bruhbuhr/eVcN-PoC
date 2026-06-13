import { useState } from "react";
import Icon from "../components/Icon";
import MobileTopBar from "../components/MobileTopBar";
import { formatVnd } from "../lib/booking";

// Stitch "My Bookings" screen with Upcoming / Past segmented control.
export default function MyBookings({ bookings, stationMap }) {
  const [tab, setTab] = useState("upcoming");
  const upcoming = bookings.filter((booking) => booking.status === "Reserved");
  const past = bookings.filter((booking) => booking.status !== "Reserved");
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <MobileTopBar />
      <div className="px-margin-mobile pb-6 pt-4">
        {/* Segmented control */}
        <div className="mb-6 mt-4 flex rounded-xl bg-surface-container-high p-1">
          {["upcoming", "past"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`flex-1 rounded-lg py-2 text-center font-body-bold font-label-caps text-[12px] uppercase tracking-[0.18em] transition-all duration-300 ${
                tab === value ? "bg-surface-container-lowest text-primary shadow-sm" : "text-slate-muted"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {list.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/20 bg-surface/95 p-8 text-center">
              <p className="font-body-bold text-on-surface">No {tab} reservations</p>
              <p className="mt-1 text-sm text-slate-muted">Ask Copilot to find you a charger.</p>
            </div>
          ) : null}

          {list.map((booking) => {
            const completed = booking.status === "Completed";
            const district = stationMap[booking.stationId]?.district || "HCMC";
            return (
              <div
                key={booking.id}
                className={`overflow-hidden rounded-xl border border-outline-variant/20 bg-surface/95 shadow-sm transition-transform active:scale-[0.98] ${completed ? "opacity-70" : ""}`}
              >
                <div className={`h-1.5 w-full ${completed ? "bg-slate-muted" : "bg-gradient-to-r from-primary to-secondary"}`} />
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-headline-md font-body-bold text-on-surface">{booking.stationName}</h3>
                      <p className="flex items-center gap-1 text-sm text-slate-muted">
                        <Icon name="location_on" className="text-[14px]" />
                        {district}, HCMC
                      </p>
                    </div>
                    {completed ? (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary">
                        <Icon name="check_circle" fill className="text-[14px]" /> COMPLETED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-wait-amber/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-wait-amber">
                        <Icon name="schedule" fill className="text-[14px]" /> RESERVED
                      </span>
                    )}
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-surface-container-low p-2">
                      <p className="text-[10px] font-bold tracking-tight text-slate-muted">TIME</p>
                      <p className="text-[13px] font-body-bold">{booking.preferredTime}</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low p-2">
                      <p className="text-[10px] font-bold tracking-tight text-slate-muted">MODEL</p>
                      <p className="text-[13px] font-body-bold">{booking.vehicleModel}</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-surface-container-low p-2">
                      <p className="text-[10px] font-bold tracking-tight text-slate-muted">ESTIMATED COST</p>
                      <p className="font-stat-lg text-[16px] text-primary">{formatVnd(booking.estimatedCost)}</p>
                    </div>
                  </div>
                  {!completed ? (
                    <div className="flex gap-2">
                      <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink-base py-3 text-sm font-body-bold text-white active:scale-95">
                        <Icon name="near_me" className="text-[18px]" /> Navigate
                      </button>
                      <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant py-3 text-sm font-body-bold text-error active:scale-95">
                        <Icon name="close" className="text-[18px]" /> Cancel
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
