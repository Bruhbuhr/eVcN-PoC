import Icon from "./Icon";

// Owner-forward run-of-show for the Tech59 demo: lead with the owner console,
// register a station live, manage it, then prove the two-sided flywheel by
// switching to the rider app and back. Shown beneath the rider view as a prompt.
export default function DemoScript() {
  const steps = [
    "Sign in as an owner and register a station live (name → chargers → price → go live)",
    "Watch it appear in the dashboard: Station Controls, utilization chart, charger table",
    "Manage it: toggle open/closed, edit price, mark a charger faulty",
    "Switch to the Rider App — the new station shows on Home and the map",
    "Ask the Copilot to charge near a district before a deadline, then reserve",
    "Switch back to the Owner Console — Revenue Today and the revenue chart update",
    "Close with the AI insights panel: utilization, faults, and the evening peak",
  ];
  return (
    <section className="mx-auto mt-8 max-w-[760px] px-4 pb-12">
      <div className="glass-card rounded-2xl border border-outline-variant/20 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
            <Icon name="dashboard_customize" fill className="text-[22px]" />
          </div>
          <div>
            <p className="font-label-caps text-[12px] uppercase tracking-[0.18em] text-primary">Demo script</p>
            <h2 className="font-headline-md text-[20px] text-on-surface">Owner-forward run-of-show</h2>
          </div>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 text-sm leading-6 text-on-surface-variant">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-base text-xs font-bold text-on-primary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-6 text-on-surface-variant">
          The two-sided flywheel is the story: an owner change reaches riders live, and a rider
          booking flows straight back into the owner&rsquo;s revenue. See{" "}
          <span className="font-body-bold text-on-surface">deliverables/09_demo_runbook.md</span> for the full talk track.
        </p>
      </div>
    </section>
  );
}
