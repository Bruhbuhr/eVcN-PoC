import Icon from "../components/Icon";
import { formatVnd } from "../lib/booking";

function Tile({ icon, color, label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
      <Icon name={icon} className={`mb-1 text-sm ${color}`} />
      <p className="mb-0.5 font-label-caps text-[10px] text-slate-muted">{label}</p>
      <p className="font-body-bold text-sm">{value}</p>
    </div>
  );
}

// Stitch standalone "Booking confirmed" success screen.
export default function BookingConfirmed({ booking, station, onViewBookings, onDone }) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden px-margin-mobile pb-10 pt-12">
      <div className="absolute -left-12 -top-24 h-64 w-64 rounded-full bg-primary-container/20 blur-[100px]" />

      <div className="z-10 mb-10 mt-8 flex flex-col items-center text-center">
        <div className="success-glow animate-float mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Icon name="check_circle" fill className="text-[40px] text-on-primary" />
          </div>
        </div>
        <h1 className="mb-2 font-mobile-headline text-[28px] text-ink-base">Booking confirmed!</h1>
        <p className="font-body-base text-slate-muted">Ready for your next silent ride.</p>
        <div className="mt-4 rounded-full bg-surface-container-high px-4 py-1.5">
          <span className="font-label-caps text-[12px] text-on-surface-variant">ID: {booking.id}</span>
        </div>
      </div>

      <div className="glass-card z-10 overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary-container to-secondary" />
        <div className="p-4">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
              <Icon name="ev_station" fill className="text-[32px]" />
            </div>
            <div>
              <h2 className="font-body-bold text-ink-base">{booking.stationName}</h2>
              <p className="text-sm text-slate-muted">{station?.location || "Ho Chi Minh City"}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2">
            <Tile icon="schedule" color="text-primary" label="TIME SLOT" value={booking.preferredTime} />
            <Tile icon="bolt" color="text-secondary" label="PORT TYPE" value={station ? `${station.chargerType} Charge` : "Fast Charge"} />
            <Tile icon="payments" color="text-wait-amber" label="EST. PRICE" value={formatVnd(booking.estimatedCost)} />
            <Tile icon="two_wheeler" color="text-primary-container" label="MOTORBIKE" value={booking.vehicleModel} />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary-container/10 bg-primary-container/5 p-4">
            <Icon name="info" className="text-primary" />
            <p className="text-xs leading-relaxed text-on-primary-container">
              Please arrive 5 minutes before your scheduled slot. Your reservation is held for a 10-minute grace period.
            </p>
          </div>
        </div>
      </div>

      <div className="z-10 mt-auto space-y-3 pt-8">
        <button
          type="button"
          onClick={onViewBookings}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink-base font-body-bold text-on-primary transition-transform active:scale-95"
        >
          <Icon name="confirmation_number" />
          View in My Bookings
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-[52px] w-full rounded-full border border-outline-variant bg-transparent font-body-bold text-ink-base transition-transform hover:bg-surface-container-high active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}
