import BottomNav from "./BottomNav";

// Centered phone frame for the rider app. Screens supply their own sticky
// header inside the scrollable area; the bottom nav is a flex sibling so the
// floating Copilot button stays inside the device frame.
export default function MobileShell({ activeTab, onNavigate, hideNav = false, children }) {
  return (
    <div className="mx-auto w-full max-w-[440px] sm:py-6">
      <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background shadow-2xl sm:h-[880px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-ink-base">
        <main className="no-scrollbar flex-1 overflow-y-auto">{children}</main>
        {hideNav ? null : <BottomNav activeTab={activeTab} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
