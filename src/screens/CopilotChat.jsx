import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { formatVnd } from "../lib/booking";

const suggestions = [
  "Find me the nearest fast charger",
  "Which charger is cheapest?",
  "I need to charge near District 1 before 6pm",
  "Can I charge to 80% in under 45 minutes?",
  "Show station owner insights",
];

function RecommendationCard({ message, onReserve }) {
  if (message.insights?.length) {
    return (
      <div className="mt-3 w-full rounded-xl border border-primary-container/30 bg-primary-container/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="insights" className="text-[18px] text-primary" />
          <p className="font-label-caps text-[11px] uppercase tracking-wider text-primary">Owner insights</p>
        </div>
        <ul className="space-y-2">
          {message.insights.map((insight) => (
            <li key={insight} className="flex gap-2 text-sm leading-6 text-on-surface-variant">
              <Icon name="check_circle" fill className="mt-0.5 text-[16px] text-primary" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!message.station || !message.canReserve) return null;

  return (
    <div className="glass-card mt-3 w-full max-w-[320px] overflow-hidden rounded-xl border border-outline-variant/30 shadow-md">
      <div className="h-1 bg-gradient-to-r from-primary-container to-secondary" />
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-body-bold text-primary">{message.station.name}</h3>
            <p className="text-[12px] text-slate-muted">{message.station.location}</p>
          </div>
          <div className="rounded-full bg-primary-container/10 px-2 py-1">
            <span className="text-[10px] font-bold text-on-primary-container">{message.station.chargerType.toUpperCase()}</span>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-surface-container-low p-2">
            <p className="font-label-caps text-[10px] text-slate-muted">EST. COST</p>
            <p className="font-stat-lg text-[18px] text-primary">{formatVnd(message.estimatedCost)}</p>
          </div>
          <div className="rounded-lg bg-surface-container-low p-2">
            <p className="font-label-caps text-[10px] text-slate-muted">DURATION</p>
            <p className="font-stat-lg text-[18px] text-primary">{message.durationMinutes} min</p>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Icon name="schedule" className="text-[16px] text-wait-amber" />
          <span className="font-body-base text-sm text-on-surface-variant">
            {message.kwhNeeded} kWh • {message.station.availablePorts} ports free
          </span>
        </div>
        <button
          type="button"
          onClick={() => onReserve(message.station)}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full charge-gradient font-body-bold text-on-primary shadow-lg transition-transform active:scale-95"
        >
          <span>Reserve recommended charger</span>
          <Icon name="arrow_forward" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

// Stitch "eVcN Copilot" chat screen, bound to the rule-based assistant engine.
export default function CopilotChat({ messages, isTyping, onAsk, onReserve }) {
  const [query, setQuery] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === "function") {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  function submit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    onAsk(query.trim());
    setQuery("");
  }

  return (
    <div className="flex min-h-full flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface/95 px-margin-mobile shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="smart_toy" fill />
          </div>
          <div>
            <h1 className="font-headline-md text-[20px] text-primary">eVcN Copilot</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              <span className="text-[11px] text-slate-muted">Online</span>
            </div>
          </div>
        </div>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
          <Icon name="bolt" />
        </button>
      </header>

      {/* Chat thread */}
      <div className="flex flex-1 flex-col gap-6 px-margin-mobile py-6">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const isLast = index === messages.length - 1;
          if (isUser) {
            return (
              <div key={`u-${index}`} className="flex flex-col items-end gap-1">
                <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-secondary px-4 py-3 text-on-secondary shadow-sm">
                  <p className="font-body-base">{message.text}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={`a-${index}`} className="flex flex-col items-start gap-1">
              <div className="glass-card max-w-[90%] rounded-2xl rounded-tl-none border border-outline-variant/20 px-4 py-3 text-on-surface shadow-sm">
                {message.needSummary ? (
                  <p className="mb-2 font-label-caps text-[11px] uppercase tracking-wider text-secondary">{message.needSummary}</p>
                ) : null}
                <p className="font-body-base">{message.text}</p>
              </div>
              <RecommendationCard message={message} onReserve={onReserve} />
              {isLast && message.quickReplies?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      disabled={isTyping}
                      onClick={() => onAsk(reply)}
                      className="rounded-full border border-primary-container/40 bg-primary-container/10 px-3 py-1.5 text-xs font-body-bold text-primary transition-colors hover:bg-primary-container/20 disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {isTyping ? (
          <div className="flex w-fit items-center gap-2 rounded-full bg-surface-container-low px-4 py-2">
            <span className="text-xs font-body-bold text-slate-muted">eVcN Copilot is thinking</span>
            <span className="flex gap-1" aria-hidden="true">
              {[0, 0.2, 0.4].map((delay) => (
                <span key={delay} className="pulsing-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: `${delay}s` }} />
              ))}
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* Suggested chips + input */}
      <div className="sticky bottom-0 z-30 flex flex-col gap-3 bg-gradient-to-t from-surface via-surface to-transparent px-margin-mobile pb-10 pt-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={isTyping}
              onClick={() => onAsk(sample)}
              className="whitespace-nowrap rounded-full border border-outline-variant/30 bg-surface-bright px-4 py-2 text-sm font-body-base text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:opacity-50"
            >
              {sample}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-outline-variant/10 bg-white p-1 shadow-lg">
          <label htmlFor="copilot-input" className="sr-only">Ask the AI Assistant</label>
          <input
            id="copilot-input"
            aria-label="Ask the AI Assistant"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isTyping}
            placeholder="Ask Copilot..."
            className="flex-grow border-none bg-transparent px-4 font-body-base text-on-surface focus:outline-none focus:ring-0 disabled:opacity-60"
          />
          <button
            type="submit"
            aria-label="Ask"
            disabled={isTyping || !query.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full charge-gradient text-white shadow-md transition-transform active:scale-90 disabled:opacity-50"
          >
            <Icon name="send" />
          </button>
        </form>
      </div>
    </div>
  );
}
