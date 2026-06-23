import { useEffect, useMemo, useState } from "react";
import {
  bookings as seedBookings,
  chargers as seedChargers,
  sessions,
  stations as seedStations,
} from "../data/mockData";
import {
  buildRevenueSeries,
  createBooking,
  createCharger,
  createStation,
  freeCharger,
  loadSavedBookings,
  loadSavedNetworkState,
  saveBookings,
  saveNetworkState,
  syncStationPorts,
  updateStationAvailability,
} from "../lib/booking";
import { buildOwnerInsights } from "../lib/assistant";

// Owns the charging network domain: stations, chargers, bookings — their
// persistence, the charger->port sync, derived dashboard data, and every
// mutation an owner or rider action performs. UI/navigation state stays in App;
// handlers that need a station (e.g. confirmBooking) take it as a parameter so
// this hook never reaches into UI state.
export default function useChargingNetwork() {
  const [stations, setStations] = useState(() => loadSavedNetworkState("evcn-stations", seedStations));
  const [bookings, setBookings] = useState(() => loadSavedBookings(seedBookings));
  const [chargers, setChargers] = useState(() => loadSavedNetworkState("evcn-chargers", seedChargers));

  useEffect(() => saveBookings(bookings), [bookings]);
  useEffect(() => saveNetworkState("evcn-stations", stations), [stations]);
  useEffect(() => saveNetworkState("evcn-chargers", chargers), [chargers]);

  // Chargers are the source of truth for ports: whenever owner actions change a
  // charger, re-derive each station's available/total ports so rider-facing data
  // (Home, Reserve, Copilot, Map) stays in sync. No-op guard avoids loops.
  useEffect(() => {
    setStations((current) => {
      const synced = syncStationPorts(current, chargers);
      const changed = synced.some(
        (station, index) =>
          station.availablePorts !== current[index].availablePorts || station.totalPorts !== current[index].totalPorts
      );
      return changed ? synced : current;
    });
  }, [chargers]);

  const stationMap = useMemo(() => Object.fromEntries(stations.map((station) => [station.id, station])), [stations]);

  const metrics = useMemo(() => {
    const totalChargers = chargers.length;
    const availableChargers = chargers.filter((charger) => charger.status === "Available").length;
    const activeSessions = sessions.length;
    const revenueToday =
      sessions.reduce((sum, session) => sum + session.revenue, 0) +
      bookings.reduce((sum, booking) => sum + (booking.estimatedCost || 0), 0);
    const unavailable = chargers.filter((charger) => charger.status !== "Available").length;
    const utilization = totalChargers ? Math.round((unavailable / totalChargers) * 100) : 0;
    const faults = chargers.filter((charger) => charger.status === "Faulty").length;
    return { totalChargers, availableChargers, activeSessions, revenueToday, utilization, faults };
  }, [bookings, chargers]);

  const insights = useMemo(() => buildOwnerInsights(stations, chargers), [stations, chargers]);

  const revenueSeries = useMemo(() => buildRevenueSeries(bookings, sessions), [bookings]);

  // --- Owner actions: mutate shared state; the sync effect + rider views propagate them.
  function toggleStationOpen(stationId) {
    setStations((current) =>
      current.map((station) => (station.id === stationId ? { ...station, isOpen: !station.isOpen } : station))
    );
  }

  function setStationPrice(stationId, price) {
    const value = Math.max(0, Math.round(Number(price) || 0));
    setStations((current) =>
      current.map((station) => (station.id === stationId ? { ...station, pricePerKwh: value } : station))
    );
  }

  function setChargerStatus(chargerId, status) {
    setChargers((current) =>
      current.map((charger) => {
        if (charger.id !== chargerId) return charger;
        if (status === "Available") return freeCharger(charger);
        return { ...charger, status };
      })
    );
  }

  function addCharger(station) {
    setChargers((current) => [...current, createCharger(station, current)]);
  }

  function removeCharger(chargerId) {
    setChargers((current) => current.filter((charger) => charger.id !== chargerId));
  }

  // Register a brand-new station from the onboarding/registration form and spawn
  // its requested chargers. The station appears immediately in the dashboard and,
  // via the port-sync effect, in every rider-facing view. Returns the new station.
  function addStation(form) {
    const station = createStation(form, stations);
    const portCount = Math.max(1, Math.round(Number(form?.chargerCount) || 1));
    setStations((current) => [...current, station]);
    setChargers((current) => {
      let list = current;
      for (let i = 0; i < portCount; i += 1) {
        list = [...list, createCharger(station, list)];
      }
      return list;
    });
    return station;
  }

  // Reserve the first available charger at a station and record the booking.
  function confirmBooking(station, formData) {
    const booking = createBooking({ station, ...formData });
    setBookings((current) => [booking, ...current]);
    setStations((current) => updateStationAvailability(current, station.id));
    setChargers((current) => {
      let updatedOne = false;
      return current.map((charger) => {
        if (!updatedOne && charger.stationId === station.id && charger.status === "Available") {
          updatedOne = true;
          return { ...charger, status: "Reserved", currentUser: booking.customerName };
        }
        return charger;
      });
    });
    return booking;
  }

  // Cancel a reservation: move it to Past and free the charger it was holding,
  // which the sync effect propagates back to station availability.
  function cancelBooking(bookingId) {
    const booking = bookings.find((item) => item.id === bookingId);
    setBookings((current) =>
      current.map((item) => (item.id === bookingId ? { ...item, status: "Cancelled" } : item))
    );
    if (!booking) return;
    setChargers((current) => {
      let freed = false;
      return current.map((charger) => {
        if (
          !freed &&
          charger.stationId === booking.stationId &&
          charger.status === "Reserved" &&
          charger.currentUser === booking.customerName
        ) {
          freed = true;
          return freeCharger(charger);
        }
        return charger;
      });
    });
  }

  return {
    stations,
    chargers,
    bookings,
    stationMap,
    metrics,
    insights,
    revenueSeries,
    toggleStationOpen,
    setStationPrice,
    setChargerStatus,
    addCharger,
    removeCharger,
    addStation,
    confirmBooking,
    cancelBooking,
  };
}
