import Icon from "./Icon";

const tabs = [
  { id: "home", label: "Home", icon: "ev_station" },
  { id: "map", label: "Map", icon: "map" },
  { id: "copilot", label: "Copilot", icon: "smart_toy", floating: true },
  { id: "bookings", label: "Bookings", icon: "confirmation_number" },
];

// Stitch bottom tab bar with a raised, glowing Copilot button in the center.
export default function BottomNav({ activeTab, onNavigate }) {
  return (
    <nav className="z-50 flex h-20 shrink-0 items-center justify-around rounded-t-xl border-t border-outline-variant/20 bg-surface/95 px-gutter shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (tab.floating) {
          return (
            <div key={tab.id} className="relative -mt-8">
              <div className="absolute -inset-2 rounded-full bg-primary-container/30 blur-xl" />
              <button
                type="button"
                onClick={() => onNavigate(tab.id)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-base text-primary-container shadow-xl transition-transform duration-150 active:scale-90"
              >
                <Icon name={tab.icon} fill className="text-[32px]" />
                <span className="sr-only">{tab.label}</span>
              </button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-caps text-[10px] text-slate-muted">
                {tab.label}
              </span>
            </div>
          );
        }
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1 transition-colors duration-150 active:scale-90 ${
              isActive ? "bg-primary-container/10 text-primary" : "text-slate-muted hover:bg-surface-container-high"
            }`}
          >
            <Icon name={tab.icon} fill={isActive} />
            <span className="font-label-caps text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
