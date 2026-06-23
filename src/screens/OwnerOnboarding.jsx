import { useState } from "react";
import Icon from "../components/Icon";

const districts = ["District 1", "Thao Dien", "District 7", "Binh Thanh", "Tan Binh"];

const chargerTypes = [
  {
    id: "Standard",
    label: "Standard",
    detail: "Steady 1.5 kW charging for overnight and long-dwell parking.",
    icon: "ev_station",
  },
  {
    id: "Fast",
    label: "Fast",
    detail: "3.5 kW for high-turnover commuter hubs near offices and retail.",
    icon: "bolt",
  },
  {
    id: "Ultra-fast",
    label: "Ultra-fast",
    detail: "6 kW destination charging for peak urban demand.",
    icon: "speed",
  },
];

function StepShell({ step, totalSteps, eyebrow, heroTitle, heroLead, heroSteps, title, description, onCancel, children }) {
  const progress = `${(step / totalSteps) * 100}%`;
  return (
    <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-2xl bg-ink-base p-6 text-white shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary">
          <Icon name="dashboard_customize" className="text-[26px]" />
        </div>
        <p className="mt-6 font-label-caps text-[12px] uppercase tracking-[0.18em] text-primary-container">{eyebrow}</p>
        <h1 className="mt-2 max-w-md font-display-lg text-[36px] leading-tight">{heroTitle}</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/72">{heroLead}</p>
        <div className="mt-8 grid gap-3 text-sm text-white/72">
          {heroSteps.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-primary-container">
                <Icon name="check" className="text-[16px]" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </aside>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <span className="font-label-caps text-[12px] uppercase tracking-[0.18em] text-primary">
            Step {step} of {totalSteps}
          </span>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: progress }} />
            </div>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-outline-variant/30 px-3 py-1 text-xs font-body-bold text-on-surface-variant transition hover:bg-surface-container-high"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
        <h2 className="mt-5 font-headline-md text-[28px] text-on-surface">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function OptionButton({ selected, icon, label, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-primary bg-primary-container/10 text-primary"
          : "border-outline-variant/30 bg-surface text-on-surface hover:border-primary/40"
      }`}
    >
      {icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
          <Icon name={icon} className="text-[22px]" />
        </span>
      ) : null}
      <span>
        <span className="block font-body-bold">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-on-surface-variant">{detail}</span>
      </span>
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 inline-flex h-12 items-center justify-center rounded-2xl px-6 font-body-bold text-on-primary transition disabled:cursor-not-allowed disabled:opacity-50 ${
        dark ? "bg-ink-base hover:bg-ink-base/90" : "bg-primary hover:bg-primary/90"
      }`}
    >
      {children}
    </button>
  );
}

// Functional owner onboarding: register a real station (name -> chargers -> price)
// and go live. The same flow is reused from the dashboard "Add New Station" button
// by passing `variant="add"` + `onCancel`. `onCreateStation(form)` actually creates
// the station in app state; `onComplete(profile)` finalizes (mark onboarding done,
// or close the modal in the add variant).
export default function OwnerOnboarding({ ownerName, onCreateStation, onComplete, variant = "onboarding", onCancel }) {
  const isAdd = variant === "add";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    district: "District 1",
    chargerType: "Fast",
    chargerCount: 4,
    pricePerKwh: 4000,
  });

  const chargerType = chargerTypes.find((item) => item.id === form.chargerType);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goLive() {
    const profile = { ...form, completedAt: new Date().toISOString() };
    onCreateStation?.(profile);
    onComplete?.(profile);
  }

  const heroLead = isAdd
    ? "Add another station to your network. It goes live the moment you finish — visible in the dashboard and to riders."
    : "Register your first station so eVcN can show its real chargers, revenue, and fault signals from the start.";
  const heroSteps = ["Name your station", "Add chargers and set a price", "Go live to riders"];
  const eyebrow = isAdd ? "Add a station" : "Owner onboarding";
  const heroTitle = isAdd ? "Add a new charging station" : "Set up your station owner workspace";

  const shellProps = { totalSteps: 4, eyebrow, heroTitle, heroLead, heroSteps, onCancel };

  if (step === 1) {
    return (
      <StepShell
        {...shellProps}
        step={1}
        title={isAdd ? "Register a new station." : `Welcome${ownerName ? `, ${ownerName}` : ""}.`}
        description="In three short steps you will register a real station, add its chargers, set a price, and take it live for riders."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "ev_station", label: "Real chargers", detail: "Spun up from the count you choose." },
            { icon: "payments", label: "Live revenue", detail: "Bookings flow into your dashboard." },
            { icon: "sensors", label: "Rider-visible", detail: "Appears on the rider map instantly." },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <Icon name={item.icon} className="text-[24px] text-primary" />
              <p className="mt-3 font-body-bold">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.detail}</p>
            </div>
          ))}
        </div>
        <PrimaryButton onClick={() => setStep(2)}>{isAdd ? "Start" : "Start setup"}</PrimaryButton>
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        {...shellProps}
        step={2}
        title="Name your station."
        description="Give the station a name riders will recognize and pick the district it operates in."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-body-bold text-on-surface">Station name</span>
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Cafe Volt District 1"
              className="mt-2 h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container/40"
            />
          </label>
          <label className="block">
            <span className="text-sm font-body-bold text-on-surface">Operating district</span>
            <select
              value={form.district}
              onChange={(event) => update("district", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container/40"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 grid gap-3">
          <span className="text-sm font-body-bold text-on-surface">Charger type</span>
          {chargerTypes.map((item) => (
            <OptionButton
              key={item.id}
              selected={form.chargerType === item.id}
              icon={item.icon}
              label={item.label}
              detail={item.detail}
              onClick={() => update("chargerType", item.id)}
            />
          ))}
        </div>
        <PrimaryButton onClick={() => setStep(3)} disabled={!form.name.trim()}>
          Continue
        </PrimaryButton>
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell
        {...shellProps}
        step={3}
        title="Add chargers and set a price."
        description="Choose how many chargers this station starts with and the price riders pay per kWh."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-body-bold text-on-surface">Number of chargers</span>
            <input
              type="number"
              min={1}
              max={20}
              value={form.chargerCount}
              onChange={(event) => update("chargerCount", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container/40"
            />
          </label>
          <label className="block">
            <span className="text-sm font-body-bold text-on-surface">Price per kWh (VND)</span>
            <input
              type="number"
              min={0}
              step={100}
              value={form.pricePerKwh}
              onChange={(event) => update("pricePerKwh", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container/40"
            />
          </label>
        </div>
        <div className="mt-5 rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Starting with <span className="font-body-bold text-on-surface">{Math.max(1, Math.round(Number(form.chargerCount) || 1))} {chargerType?.label.toLowerCase()} chargers</span> at{" "}
          <span className="font-body-bold text-on-surface">{Math.max(0, Math.round(Number(form.pricePerKwh) || 0)).toLocaleString("vi-VN")} VND/kWh</span>.
        </div>
        <PrimaryButton onClick={() => setStep(4)}>Review</PrimaryButton>
      </StepShell>
    );
  }

  return (
    <StepShell
      {...shellProps}
      step={4}
      title="Review and go live."
      description="Confirm the details below. Going live creates the station and its chargers right away."
    >
      <div className="grid gap-3 rounded-2xl border border-primary/20 bg-primary-container/10 p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Station</span>
          <span className="font-body-bold text-on-surface">{form.name.trim() || "New eVcN Station"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">District</span>
          <span className="font-body-bold text-on-surface">{form.district}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Chargers</span>
          <span className="font-body-bold text-on-surface">
            {Math.max(1, Math.round(Number(form.chargerCount) || 1))} × {chargerType?.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Price</span>
          <span className="font-body-bold text-on-surface">
            {Math.max(0, Math.round(Number(form.pricePerKwh) || 0)).toLocaleString("vi-VN")} VND/kWh
          </span>
        </div>
      </div>
      <PrimaryButton dark onClick={goLive}>
        {isAdd ? "Add station" : "Go live"}
      </PrimaryButton>
    </StepShell>
  );
}
