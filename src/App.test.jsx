import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders the main navigation", () => {
  render(<App />);

  expect(screen.getByRole("button", { name: /Driver App/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Station Dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /AI Assistant/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Bookings/i })).toBeInTheDocument();
});

test("opens booking modal from a station card", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /Reserve Charger/i })[0]);

  expect(screen.getByRole("dialog", { name: /Reserve charger/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Motorcycle model/i)).toBeInTheDocument();
});

test("closes booking modal with Escape", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /Reserve Charger/i })[0]);
  await user.keyboard("{Escape}");

  expect(screen.queryByRole("dialog", { name: /Reserve charger/i })).not.toBeInTheDocument();
});

test("prevents booking when target battery is not higher than current battery", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getAllByRole("button", { name: /Reserve Charger/i })[0]);
  await user.clear(screen.getByLabelText(/Target battery/i));
  await user.type(screen.getByLabelText(/Target battery/i), "20");
  await user.click(screen.getByRole("button", { name: /Confirm booking/i }));

  expect(screen.getByText(/Target battery must be higher/i)).toBeInTheDocument();
  expect(screen.queryByText(/Booking confirmed/i)).not.toBeInTheDocument();
});

test("AI assistant can reserve a recommended charger", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  expect(screen.getAllByText(/mobility charging consultant/i).length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: /I need to charge near District 1 before 6pm/i }));
  expect(screen.getByText(/eVcN Copilot is thinking/i)).toBeInTheDocument();
  await user.click(await screen.findByRole("button", { name: /Reserve recommended charger/i }));

  const dialog = screen.getByRole("dialog", { name: /Reserve charger/i });
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByText(/eVcN District 1 Hub/i)).toBeInTheDocument();
});

test("AI assistant shows owner insights as a non-reservable chat response", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "Show station owner insights");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/owner view/i)).toBeInTheDocument();
  expect(screen.getAllByText(/utilization/i).length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("AI assistant treats hello as a greeting instead of a reservation recommendation", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "hello");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("AI assistant treats a mistyped hello as a greeting", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "helu");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/tell me what you need/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
});

test("AI assistant asks a clarifying question for a vague request instead of recommending", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "I need to charge");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  expect(await screen.findByText(/what matters most/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Reserve recommended charger/i })).not.toBeInTheDocument();
  // Quick-reply chips let the user answer in one tap.
  expect(screen.getByRole("button", { name: /Just recommend one/i })).toBeInTheDocument();
});

test("AI assistant recommends after the user taps a quick-reply chip", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /AI Assistant/i }));
  await user.type(screen.getByLabelText(/Ask the AI Assistant/i), "I need to charge");
  await user.click(screen.getByRole("button", { name: /^Ask$/i }));

  await user.click(await screen.findByRole("button", { name: /^Cheapest$/i }));

  expect(await screen.findByRole("button", { name: /Reserve recommended charger/i })).toBeInTheDocument();
});

test("owner closing a station on the dashboard propagates to the driver app", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Driver view: the District 1 hub is reservable.
  const cardBefore = screen.getByText("eVcN District 1 Hub").closest("article");
  expect(within(cardBefore).getByRole("button", { name: /Reserve Charger/i })).toBeEnabled();

  // Owner closes that station on the dashboard.
  await user.click(screen.getByRole("button", { name: /Station Dashboard/i }));
  await user.click(screen.getByRole("button", { name: /Close eVcN District 1 Hub/i }));

  // Back on the driver app, the same station can no longer be reserved.
  await user.click(screen.getByRole("button", { name: /Driver App/i }));
  const cardAfter = screen.getByText("eVcN District 1 Hub").closest("article");
  expect(within(cardAfter).getByRole("button", { name: /Reserve Charger/i })).toBeDisabled();
});

test("owner marking a charger faulty reduces the station's available ports for riders", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Station Dashboard/i }));
  // District 7 has 4 available chargers; faulting one should drop availability.
  const row = screen.getByText("D7-S01").closest("tr");
  await user.click(within(row).getByRole("button", { name: /^Fault$/i }));

  await user.click(screen.getByRole("button", { name: /Driver App/i }));
  const card = screen.getByText("eVcN District 7 Crescent").closest("article");
  expect(within(card).getByText("3/4")).toBeInTheDocument();
});
