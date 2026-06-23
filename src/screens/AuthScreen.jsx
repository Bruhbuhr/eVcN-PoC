import { useState } from "react";
import Icon from "../components/Icon";

function Field({ label, type = "text", value, onChange, autoComplete, required = true }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-body-bold text-on-surface">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 text-base text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-container/40"
      />
    </label>
  );
}

export default function AuthScreen({ configStatus, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("driver");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const isOwner = accountType === "owner";

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const result = await onRegister({ ...form, role: accountType });
        if (!result?.session) {
          setStatus("Registration submitted. Please check your email to confirm your account before signing in.");
        }
      } else {
        await onLogin(form);
      }
    } catch (authError) {
      setError(authError?.message || "Authentication failed. Check your Supabase credentials and test account setup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.16),transparent_24rem)] px-4 py-10">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-outline-variant/20 bg-surface p-6 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-base text-primary-container">
            <Icon name="bolt" fill className="text-[26px]" />
          </div>
          <p className="mt-5 font-label-caps text-[12px] uppercase tracking-[0.18em] text-primary">eVcN account</p>
          <h1 className="mt-2 font-display-lg text-[34px] leading-tight text-primary">Sign in to eVcN</h1>
          <p className="mt-3 text-base leading-7 text-on-surface-variant">
            Use separate Supabase Auth paths for motorcycle drivers and station owners. The demo app remains local for bookings and charging data.
          </p>
          {!configStatus.isConfigured ? (
            <div className="mt-5 rounded-2xl border border-wait-amber/30 bg-wait-amber/10 p-4 text-sm leading-6 text-on-surface">
              <p className="font-body-bold">Supabase is not configured yet.</p>
              <p className="mt-2">Add these Vite environment variables to connect registration and login:</p>
              <ul className="mt-2 list-inside list-disc">
                {configStatus.missing.map((key) => (
                  <li key={key}>
                    <code>{key}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <form onSubmit={submit} className="rounded-[2rem] border border-outline-variant/20 bg-surface p-6 shadow-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: "driver", label: "Driver account", description: "Find, reserve, and manage charging." },
              { id: "owner", label: "Owner account", description: "Monitor stations and revenue." },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccountType(option.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  accountType === option.id
                    ? "border-primary bg-primary-container/10 text-primary"
                    : "border-outline-variant/30 bg-surface text-on-surface-variant hover:border-primary/40"
                }`}
              >
                <span className="block text-sm font-body-bold">{option.label}</span>
                <span className="mt-1 block text-xs leading-5">{option.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex rounded-full bg-surface-container-high p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`h-11 flex-1 rounded-full text-sm font-body-bold transition ${
                !isRegister ? "bg-ink-base text-on-primary" : "text-on-surface-variant"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`h-11 flex-1 rounded-full text-sm font-body-bold transition ${
                isRegister ? "bg-ink-base text-on-primary" : "text-on-surface-variant"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {isRegister ? (
              <>
                <Field label="Full name" value={form.fullName} onChange={(value) => update("fullName", value)} autoComplete="name" />
                <Field label="Phone number" value={form.phone} onChange={(value) => update("phone", value)} autoComplete="tel" />
              </>
            ) : null}
            <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} autoComplete="email" />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => update("password", value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {error ? <p className="mt-4 rounded-2xl bg-error/10 p-3 text-sm text-error">{error}</p> : null}
          {status ? <p className="mt-4 rounded-2xl bg-primary-container/10 p-3 text-sm text-primary">{status}</p> : null}

          <button
            type="submit"
            disabled={!configStatus.isConfigured || isSubmitting}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-body-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-outline-variant"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegister
                ? `Register ${isOwner ? "owner" : "driver"} account`
                : `Sign in as ${isOwner ? "owner" : "driver"}`}
          </button>
        </form>
      </section>
    </main>
  );
}
