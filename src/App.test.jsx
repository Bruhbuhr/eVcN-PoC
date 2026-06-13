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
