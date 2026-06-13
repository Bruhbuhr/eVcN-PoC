import Icon from "./Icon";

// Stitch rider TopAppBar: bolt logo, district label, battery chip, avatar.
export default function MobileTopBar({ battery = 23, district = "District 1, HCMC" }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface/95 px-margin-mobile shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-base text-primary-container">
          <Icon name="bolt" fill className="text-[20px]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display-lg text-[20px] leading-none tracking-tight text-primary">eVcN</span>
          <span className="font-label-caps text-[10px] uppercase tracking-widest text-slate-muted">{district}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-high px-3 py-1.5">
          <Icon name="battery_2_bar" fill className="text-[16px] text-wait-amber" />
          <span className="font-body-bold text-[14px]">{battery}%</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container/30 bg-surface-container text-slate-muted">
          <Icon name="person" fill className="text-[22px]" />
        </div>
      </div>
    </header>
  );
}
