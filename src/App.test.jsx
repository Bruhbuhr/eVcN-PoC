import { beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// The app persists stations/chargers/bookings to localStorage; reset it so each
// test starts from the seed data and stays independent of execution order.
beforeEach(() => {
  localStorage.clear();
});

test("renders the rider/owner switch and bottom navigation", () => {
  render(<App />);

  expect(screen.getByRole("button", { name: /Rider App/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Owner Console/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Home$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Map$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Copilot$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^Bookings$/i })).toBeInTheDocument();
});

test("opens the reserve screen from a station card", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);

  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Motorbike model/i)).toBeInTheDocument();
});

test("returns from the reserve screen with the back button", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Back$/i }));

  expect(screen.queryByRole("heading", { name: /Reserve a charger/i })).not.toBeInTheDocument();
});

test("prevents booking when target battery is not higher than current battery", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  // The target battery is a range slider; set it below the current battery (30%).
  fireEvent.change(screen.getByLabelText(/Target battery/i), { target: { value: "20" } });
  await user.click(screen.getByRole("button", { name: /Confirm booking/i }));

  expect(screen.getByText(/Target battery must be higher/i)).toBeInTheDocument();
  expect(screen.queryByText(/Booking confirmed/i)).not.toBeInTheDocument();
});

test("Copilot can reserve a recommended charger", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.click(screen.getByRole("button", { name: /I need to charge near District 1 before 6pm/i }));
  expect(screen.getByText(/eVcN Copilot is thinking/i)).toBeInTheDocument();
  await user.click(await screen.findByRole("button", { name: /Reserve recommended charger/i }));

  expect(screen.getByRole("heading", { name: /Reserve a charger/i })).toBeInTheDocument();
  expect(screen.getByText(/eVcN District 1 Hub/i)).toBeInTheDocument();
});

test("Copilot shows owner insights as a non-reservable chat response", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "Show station owner insights");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/owner view/i)).toBeInTheDocument();
  expect(screen.getAllByText(/utilization/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot treats hello as a greeting instead of a reservation recommendation", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "hello");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot treats a mistyped hello as a greeting", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "helu");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("Copilot asks a clarifying question for a vague request instead of recommending", async () => {
  const user = userEvent.setup();
  render(<App />);

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
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Copilot$/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "I need to charge");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  await user.click(await screen.findByRole("button", { name: /^Cheapest$/i }));

  expect(await screen.findByRole("button", { name: /Reserve recommended charger/i })).toBeInTheDocument();
});

test("owner closing a station on the dashboard propagates to the rider app", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Rider home: the District 1 hub is reservable.
  const cardBefore = screen.getByText("eVcN District 1 Hub").closest("article");
  expect(within(cardBefore).getByRole("button", { name: /^Reserve$/i })).toBeEnabled();

  // Owner closes that station on the dashboard.
  await user.click(screen.getByRole("button", { name: /Owner Console/i }));
  await user.click(screen.getByRole("button", { name: /Close eVcN District 1 Hub/i }));

  // Back on the rider app, the same station can no longer be reserved.
  await user.click(screen.getByRole("button", { name: /Rider App/i }));
  const cardAfter = screen.getByText("eVcN District 1 Hub").closest("article");
  expect(within(cardAfter).getByRole("button", { name: /^Reserve$/i })).toBeDisabled();
});

test("completes a booking and shows the confirmation, then lists it in My Bookings", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /^Reserve$/i })[0]);
  await user.click(screen.getByRole("button", { name: /Confirm booking/i }));

  expect(await screen.findByText(/Booking confirmed/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /View in My Bookings/i }));
  expect(screen.getByRole("button", { name: /^UPCOMING$/i })).toBeInTheDocument();
  expect(screen.getAllByText(/eVcN District 1 Hub/i).length).toBeGreaterThan(0);
});

test("navigates to the map and bookings tabs without errors", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /^Map$/i }));
  expect(screen.getByRole("heading", { name: /Nearest Stations/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /^Bookings$/i }));
  expect(screen.getByRole("button", { name: /^UPCOMING$/i })).toBeInTheDocument();
});

test("owner marking a charger faulty reduces the station's available ports for riders", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Owner Console/i }));
  // District 7 has 4 available chargers; faulting one should drop availability.
  const row = screen.getByText("D7-S01").closest("tr");
  await user.click(within(row).getByRole("button", { name: /^Fault$/i }));

  await user.click(screen.getByRole("button", { name: /Rider App/i }));
  const card = screen.getByText("eVcN District 7 Crescent").closest("article");
  expect(within(card).getByText("3/4")).toBeInTheDocument();
});
