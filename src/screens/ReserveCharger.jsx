import { useState } from "react";
import Icon from "../components/Icon";
import { estimateCharging, formatVnd } from "../lib/booking";
import { timeSlots } from "../data/mockData";

function Field({ label, icon, value, onChange, type = "text" }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-label-caps text-[12px] text-slate-muted">{label}</span>
      <div className="relative">
        {icon ? <Icon name={icon} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-muted" /> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border-none bg-surface-container-low py-3 font-body-base text-on-surface focus:ring-2 focus:ring-primary-container ${
            icon ? "pl-12 pr-4" : "px-4"
          }`}
        />
      </div>
    </label>
  );
}

// Stitch "Reserve a charger" screen with the live charge-gradient estimate panel.
export default function ReserveCharger({ station, onConfirm, onBack }) {
  const [form, setForm] = useState({
    vehicleModel: "VinFast Feliz S",
    currentBattery: 30,
    targetBattery: 80,
    preferredTime: "17:30",
    customerName: "Demo Driver",
    phone: "0901234567",
  });
  const [error, setError] = useState("");

  const estimate = estimateCharging({
    station,
    currentBattery: form.currentBattery,
    targetBattery: form.targetBattery,
    chargerType: station.chargerType,
  });
  const chargePercent = Math.min(100, Math.max(0, Number(form.targetBattery) - Number(form.currentBattery)));

  function update(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const currentBattery = Number(form.currentBattery);
    const targetBattery = Number(form.targetBattery);
    const vehicleModel = form.vehicleModel.trim();
    const customerName = form.customerName.trim();
    const phone = form.phone.trim();

    if (!vehicleModel || !customerName || !phone) {
      setError("Please complete motorcycle, name, and phone details.");
      return;
    }
    if (!/^[0-9+() .-]{8,}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (targetBattery <= currentBattery) {
      setError("Target battery must be higher than current battery.");
      return;
    }
    onConfirm(form);
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-outline-variant/10 bg-surface/95 px-margin-mobile shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-high"
        >
          <Icon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="font-display-lg text-[22px] tracking-tight text-primary">Reserve a charger</h1>
      </header>

      <form onSubmit={submit} className="space-y-6 px-margin-mobile pb-10 pt-5">
        {/* Station header */}
        <div className="glass-card relative overflow-hidden rounded-xl p-4">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-primary-container to-primary" />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-1 font-headline-md text-[20px] text-on-surface">{station.name}</h2>
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <Icon name="location_on" className="text-[18px]" />
                <span className="font-body-base text-sm">{station.location}</span>
              </div>
            </div>
            <div className="rounded-full bg-primary-container/10 px-3 py-1">
              <span className="font-label-caps text-[11px] text-primary">{formatVnd(station.pricePerKwh)}/kWh</span>
            </div>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-error-rose/40 bg-error-rose/10 px-4 py-3 text-sm font-body-bold text-error">
            {error}
          </div>
        ) : null}

        {/* Form fields */}
        <div className="space-y-4">
          <Field label="MOTORBIKE MODEL" icon="two_wheeler" value={form.vehicleModel} onChange={(value) => update("vehicleModel", value)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="NAME" value={form.customerName} onChange={(value) => update("customerName", value)} />
            <Field label="PHONE" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
          </div>
          <label className="flex flex-col gap-2">
            <span className="font-label-caps text-[12px] text-slate-muted">PREFERRED TIME</span>
            <div className="relative">
              <Icon name="schedule" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-muted" />
              <select
                value={form.preferredTime}
                onChange={(event) => update("preferredTime", event.target.value)}
                className="w-full rounded-xl border-none bg-surface-container-low py-3 pl-12 pr-4 font-body-base text-on-surface focus:ring-2 focus:ring-primary-container"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </label>

          {/* Battery target */}
          <div className="glass-card space-y-4 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[12px] text-slate-muted">BATTERY TARGET</span>
              <span className="font-stat-lg text-primary">{form.targetBattery}%</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="font-label-caps text-[12px] text-slate-muted">CURRENT</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-wait-amber">
                  <span className="font-body-bold text-wait-amber">{form.currentBattery}%</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <label htmlFor="current-battery" className="sr-only">Current battery %</label>
                <input
                  id="current-battery"
                  type="range"
                  min="0"
                  max="100"
                  value={form.currentBattery}
                  onChange={(event) => update("currentBattery", event.target.value)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-wait-amber"
                />
                <label htmlFor="target-battery" className="sr-only">Target battery %</label>
                <input
                  id="target-battery"
                  type="range"
                  min="0"
                  max="100"
                  value={form.targetBattery}
                  onChange={(event) => update("targetBattery", event.target.value)}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-primary"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="font-label-caps text-[12px] text-slate-muted">TARGET</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/5">
                  <span className="font-body-bold text-primary">{form.targetBattery}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live estimate panel */}
        <div className="relative overflow-hidden rounded-2xl bg-ink-base p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-32 w-32 bg-primary/20 blur-[60px]" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-label-caps text-[12px] tracking-[0.2em] text-primary-container">LIVE ESTIMATE</h3>
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
            </div>
            <div className="mb-6">
              <span className="mb-1 block font-display-2xl text-[44px] leading-none text-white">{formatVnd(estimate.estimatedCost)}</span>
              <div className="flex items-center gap-2 text-primary-container/80">
                <Icon name="electric_bolt" className="text-[20px]" />
                <span className="font-body-base">{estimate.kwhNeeded} kWh needed</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-label-caps text-[12px] text-white/60">
                <span>ESTIMATED DURATION</span>
                <span>{estimate.durationMinutes} MINS</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="charge-gradient-animate h-full rounded-full shadow-[0_0_15px_rgba(25,230,140,0.5)]"
                  style={{ width: `${chargePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink-base font-body-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Confirm booking
          <Icon name="arrow_forward" />
        </button>
      </form>
    </>
  );
}
