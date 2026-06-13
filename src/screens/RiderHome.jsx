import Icon from "../components/Icon";
import MobileTopBar from "../components/MobileTopBar";
import StationCard from "../components/StationCard";

const chips = [
  { id: "fast", label: "Fast", icon: "bolt" },
  { id: "cheapest", label: "Cheapest" },
  { id: "available", label: "Available" },
  { id: "closest", label: "Closest" },
];

// Stitch "Rider Home — find & compare" screen.
export default function RiderHome({ filters, setFilters, stations, onReserve, onOpenCopilot, onOpenMap }) {
  return (
    <>
      <MobileTopBar />
      <div className="flex flex-col gap-6 px-margin-mobile pb-6 pt-4">
        {/* Hero: AI Copilot search pill */}
        <section className="mt-2">
          <button
            type="button"
            onClick={onOpenCopilot}
            className="group relative block w-full text-left transition-transform duration-200 active:scale-[0.98]"
          >
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary-container to-secondary-container opacity-20 blur transition duration-300 group-hover:opacity-40" />
            <div className="relative flex h-14 items-center gap-3 rounded-full border border-outline-variant/30 bg-surface pl-5 pr-2 shadow-sm">
              <Icon name="smart_toy" className="text-primary" />
              <span className="flex-1 font-body-base text-slate-muted">Ask eVcN Copilot...</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full charge-gradient text-on-primary-container shadow-md">
                <Icon name="arrow_forward" />
              </div>
            </div>
          </button>
        </section>

        {/* Filter chips */}
        <section className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => {
            const active = filters[chip.id];
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, [chip.id]: !current[chip.id] }))}
                aria-pressed={active}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 font-body-bold text-[14px] ${
                  active
                    ? "bg-ink-base text-on-primary"
                    : "border border-outline-variant/50 bg-surface text-on-surface-variant"
                }`}
              >
                {chip.icon ? <Icon name={chip.icon} className="text-[18px]" /> : null}
                {chip.label}
              </button>
            );
          })}
        </section>

        {/* Map preview card */}
        <section>
          <button
            type="button"
            onClick={onOpenMap}
            className="group relative block h-44 w-full overflow-hidden rounded-3xl border border-outline-variant/20 shadow-sm"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(25,230,140,0.18),transparent_18rem),linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:100%_100%,40px_40px,40px_40px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/40 bg-surface/90 px-4 py-2 shadow-lg backdrop-blur-md">
              <Icon name="near_me" className="text-[18px] text-primary" />
              <span className="font-body-bold text-[12px]">Expand Full Map</span>
            </div>
          </button>
        </section>

        {/* Station list header */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-[24px] text-on-surface">Nearby Stations</h2>
          <span className="font-body-bold text-[14px] text-primary">See all</span>
        </div>

        {/* Station cards */}
        <section className="flex flex-col gap-4">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} onReserve={onReserve} />
          ))}
        </section>
      </div>
    </>
  );
}
