import { beforeEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

let mockConfigStatus = { isConfigured: false, missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] };
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock("./lib/auth", async () => {
  const actual = await vi.importActual("./lib/auth");
  return {
    ...actual,
    getSupabaseConfigStatus: () => mockConfigStatus,
    createSupabaseBrowserClient: () => (mockConfigStatus.isConfigured ? mockSupabaseClient : null),
  };
});

// The app persists stations/chargers/bookings to localStorage; reset it so each
// test starts from the seed data and stays independent of execution order.
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockConfigStatus = { isConfigured: true, missing: [] };
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        access_token: "token",
        user: { id: "user-1", email: "rider@evcn.test", user_metadata: { full_name: "Minh Rider", role: "driver" } },
      },
    },
    error: null,
  });
  mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  mockSupabaseClient.auth.signUp.mockResolvedValue({
    data: { user: { id: "user-1", email: "rider@evcn.test", user_metadata: { full_name: "Minh Rider", role: "driver" } }, session: null },
    error: null,
  });
  mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
    data: { user: { id: "user-1", email: "rider@evcn.test", user_metadata: { full_name: "Minh Rider", role: "driver" } }, session: { access_token: "token" } },
    error: null,
  });
  mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
});

test("shows Supabase setup instructions when auth env config is missing", async () => {
  mockConfigStatus = { isConfigured: false, missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] };
  render(<App />);

  expect(await screen.findByRole("heading", { name: /Sign in to eVcN/i })).toBeInTheDocument();
  expect(screen.getByText(/VITE_SUPABASE_URL/i)).toBeInTheDocument();
  expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/i)).toBeInTheDocument();
});

test("falls back to sign in if Supabase session loading fails", async () => {
  mockConfigStatus = { isConfigured: true, missing: [] };
  mockSupabaseClient.auth.getSession.mockRejectedValue(new Error("Network unavailable"));
  render(<App />);

  expect(await screen.findByRole("heading", { name: /Sign in to eVcN/i })).toBeInTheDocument();
});

test("registers a rider through the auth screen", async () => {
  mockConfigStatus = { isConfigured: true, missing: [] };
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /Create account/i }));
  await user.type(screen.getByLabelText(/Full name/i), "Minh Rider");
  await user.type(screen.getByLabelText(/Phone number/i), "0901000000");
  await user.type(screen.getByLabelText(/Email/i), "rider@evcn.test");
  await user.type(screen.getByLabelText(/^Password/i), "password123");
  await user.click(screen.getByRole("button", { name: /Register/i }));

  expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
    expect.objectContaining({
      email: "rider@evcn.test",
      options: expect.objectContaining({
        data: expect.objectContaining({ role: "driver" }),
      }),
    })
  );
  expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
});

test("registers a station owner through the owner auth path", async () => {
  mockConfigStatus = { isConfigured: true, missing: [] };
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /Owner account/i }));
  await user.click(screen.getByRole("button", { name: /Create account/i }));
  await user.type(screen.getByLabelText(/Full name/i), "Tuan Owner");
  await user.type(screen.getByLabelText(/Phone number/i), "0902000000");
  await user.type(screen.getByLabelText(/Email/i), "owner@evcn.test");
  await user.type(screen.getByLabelText(/^Password/i), "password123");
  await user.click(screen.getByRole("button", { name: /Register owner account/i }));

  expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(
    expect.objectContaining({
      email: "owner@evcn.test",
      options: expect.objectContaining({
        data: expect.objectContaining({ role: "owner" }),
      }),
    })
  );
});

test("logs in and signs out", async () => {
  mockConfigStatus = { isConfigured: true, missing: [] };
  mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const user = userEvent.setup();
  render(<App />);

  await user.type(await screen.findByLabelText(/Email/i), "rider@evcn.test");
  await user.type(screen.getByLabelText(/^Password/i), "password123");
  await user.click(screen.getByRole("button", { name: /Sign in as driver/i }));

  expect(await screen.findByRole("button", { name: /Rider App/i })).toBeInTheDocument();
  expect(screen.getByText(/Minh Rider/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Sign out/i }));

  expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  expect(await screen.findByRole("heading", { name: /Sign in to eVcN/i })).toBeInTheDocument();
});

async function renderSignedInApp() {
  render(<App />);
  await screen.findByRole("button", { name: /^Home$/i });
}

async function renderSignedInOwnerApp() {
  localStorage.setItem("evcn-owner-onboarding:owner-1", "complete");
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        access_token: "token",
        user: { id: "owner-1", email: "owner@evcn.test", user_metadata: { full_name: "Tuan Owner", role: "owner" } },
      },
    },
    error: null,
  });
  render(<App />);
  await screen.findByRole("heading", { name: /System Pulse/i });
}

async function renderNewOwnerApp() {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        access_token: "token",
        user: { id: "owner-1", email: "owner@evcn.test", user_metadata: { full_name: "Tuan Owner", role: "owner" } },
      },
    },
    error: null,
  });
  render(<App />);
  await screen.findByRole("heading", { name: /Set up your station owner workspace/i });
}

test("driver accounts cannot open the owner console", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  const ownerButton = screen.getByRole("button", { name: /Owner Console/i });
  expect(ownerButton).toBeDisabled();
  expect(screen.getByText(/Driver account/i)).toBeInTheDocument();

  await user.click(ownerButton);
  expect(screen.queryByRole("heading", { name: /Station Command Center/i })).not.toBeInTheDocument();
});

test("owner accounts only see the owner console", async () => {
  const user = userEvent.setup();
  await renderSignedInOwnerApp();

  expect(screen.getByText(/Owner account/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Owner Console/i })).toBeEnabled();
  expect(screen.getByRole("button", { name: /Rider App/i })).toBeDisabled();

  expect(screen.getByRole("heading", { name: /System Pulse/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Rider App/i }));
  expect(screen.queryByRole("button", { name: /^Home$/i })).not.toBeInTheDocument();
});

test("new station owners complete onboarding before seeing the dashboard", async () => {
  const user = userEvent.setup();
  await renderNewOwnerApp();

  expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Start setup/i }));
  await user.type(screen.getByLabelText(/Station name/i), "Tuan Charging Hub");
  await user.selectOptions(screen.getByLabelText(/Operating district/i), "District 1");
  await user.click(screen.getByRole("button", { name: /Continue/i }));
  await user.click(screen.getByRole("button", { name: /^Review$/i }));
  await user.click(screen.getByRole("button", { name: /Go live/i }));

  expect(await screen.findByRole("heading", { name: /System Pulse/i })).toBeInTheDocument();
  expect(localStorage.getItem("evcn-owner-onboarding:owner-1")).toBe("complete");
});

test("registering a station in onboarding adds it to the owner dashboard", async () => {
  const user = userEvent.setup();
  await renderNewOwnerApp();

  await user.click(screen.getByRole("button", { name: /Start setup/i }));
  await user.type(screen.getByLabelText(/Station name/i), "Cafe Volt Lab");
  await user.selectOptions(screen.getByLabelText(/Operating district/i), "District 7");
  await user.click(screen.getByRole("button", { name: /Continue/i }));
  await user.click(screen.getByRole("button", { name: /^Review$/i }));
  await user.click(screen.getByRole("button", { name: /Go live/i }));

  await screen.findByRole("heading", { name: /System Pulse/i });
  expect(screen.getAllByText(/Cafe Volt Lab/i).length).toBeGreaterThan(0);
});

test("renders the rider/owner switch and bottom navigation", async () => {
  await renderSignedInApp();

  expect(screen.getByRole("button", { name: /Rider App/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Owner Console/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Home$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Map$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Copilot$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Bookings$/i })).toBeInTheDocument();
});

test("opens the reserve screen from a station card", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);

  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Motorbike model/i)).toBeInTheDocument();
});

test("returns from the reserve screen with the back button", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Back$/i }));

  expect(screen.queryByRole("heading", { name: /Reserve a charger/i })).not.toBeInTheDocument();
});

test("prevents booking when target battery is not higher than current battery", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  // The target battery is a range slider; set it below the current battery (30%).
  fireEvent.change(screen.getByLabelText(/Target battery/i), { target: { value: "20" } });
  await user.click(screen.getByRole("button", { name: /Confirm booking/i }));

  expect(screen.getByText(/Target battery must be higher/i)).toBeInTheDocument();
  expect(screen.queryByText(/Booking confirmed/i)).not.toBeInTheDocument();
});

test("Copilot can reserve a recommended charger", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.click(screen.getByRole("button", { name: /I need to charge near District 1 before 6pm/i }));
  expect(screen.getByText(/eVcN Copilot is thinking/i)).toBeInTheDocument();
  await user.click(await screen.findByRole("button", { name: /Reserve recommended charger/i }));

  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();
  expect(screen.getByText(/eVcN District 1 Hub/i)).toBeInTheDocument();
});

test("Copilot shows owner insights as a non-reservable chat response", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "Show station owner insights");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/owner view/i)).toBeInTheDocument();
  expect(screen.getAllByText(/utilization/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot treats hello as a greeting instead of a reservation recommendation", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "hello");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot treats a mistyped hello as a greeting", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "helu");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot asks a clarifying question for a vague request instead of recommending", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "I need to charge");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/what matters most/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
  // Quick-reply chips let the user answer in one tap.
  expect(screen.getByRole("button", { name: /Just recommend one/i })).toBeInTheDocument();
});

test("Copilot recommends after the user taps a quick-reply chip", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "I need to charge");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  await user.click(await screen.findByRole("button", { name: /^Cheapest$/i }));

  expect(await screen.findByRole("button", { name: /Reserve recommended charger/i })).toBeInTheDocument();
});

test("owner closing a station updates the owner dashboard state", async () => {
  const user = userEvent.setup();
  await renderSignedInOwnerApp();

  await user.click(screen.getByRole("button", { name: /Close eVcN District 1 Hub/i }));

  expect(screen.getByRole("button", { name: /Open eVcN District 1 Hub/i })).toBeInTheDocument();
});

test("completes a booking and shows the confirmation, then lists it in My Bookings", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  await user.click(screen.getByRole("button", { name: /Confirm booking/i }));

  expect(await screen.findByText(/Booking confirmed/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /View in My Bookings/i }));
  expect(screen.getByRole("button", { name: /^UPCOMING$/i })).toBeInTheDocument();
  expect(screen.getAllByText(/eVcN District 1 Hub/i).length).toBeGreaterThan(0);
});

test("navigates to the map and bookings tabs without errors", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Map$/i }));
  expect(screen.getByRole("heading", { name: /Nearest Stations/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Bookings$/i }));
  expect(screen.getByRole("button", { name: /^UPCOMING$/i })).toBeInTheDocument();
});

test("cancelling an upcoming booking moves it to the Past tab", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Bookings$/i }));
  const cancelButtons = screen.getAllByRole("button", { name: /Cancel booking at/i });
  const countBefore = cancelButtons.length;
  expect(countBefore).toBeGreaterThan(0);

  await user.click(cancelButtons[0]);

  // One fewer reservation remains under Upcoming.
  expect(screen.getAllByRole("button", { name: /Cancel booking at/i }).length).toBe(countBefore - 1);

  // It now shows as cancelled under Past.
  await user.click(screen.getByRole("button", { name: /^PAST$/i }));
  expect(screen.getByText(/CANCELLED/i)).toBeInTheDocument();
});

test("Navigate on a booking opens the map", async () => {
  const user = userEvent.setup();
  await renderSignedInApp();

  await user.click(screen.getByRole("button", { name: /^Bookings$/i }));
  await user.click(screen.getAllByRole("button", { name: /^Navigate$/i })[0]);

  expect(screen.getByRole("heading", { name: /Nearest Stations/i })).toBeInTheDocument();
});

test("owner marking a charger faulty updates charger status on the dashboard", async () => {
  const user = userEvent.setup();
  await renderSignedInOwnerApp();

  const row = screen.getByText("D7-S01").closest("tr");
  await user.click(within(row).getByRole("button", { name: /^Fault$/i }));

  expect(within(row).getByText(/Faulty/i)).toBeInTheDocument();
});
