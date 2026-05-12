import { useState, useRef, useCallback, useEffect } from "react";
import { createInitialState, createEmptyStats, simulateStep, cancelFlight, generateDemand } from "./simulation";
import { planRoute } from "./planner";
import { getDeadlineHours } from "../data/flights";
import { AIRPORTS as DEFAULT_AIRPORTS, type Airport } from "../data/airports";
import type { SimulationState, SimEvent, BaggageGroup, Airline } from "./types";
import { toast } from "sonner";

const DEFAULT_AIRLINES: Airline[] = [
  { id: "AL-001", name: "AeroLatam", code: "ALT", email: "contacto@aerolatam.com", password: "aerolatam123", assignedAirports: ["GRU", "EZE", "BOG", "LIM", "SCL"] },
  { id: "AL-002", name: "SkyEurope", code: "SKE", email: "ops@skyeurope.eu", password: "skyeurope123", assignedAirports: ["MAD", "CDG", "FRA", "LHR", "AMS", "FCO"] },
  { id: "AL-003", name: "AsiaWings", code: "ASW", email: "info@asiawings.asia", password: "asiawings123", assignedAirports: ["NRT", "PEK", "ICN", "SIN", "BKK", "DEL"] },
  { id: "AL-004", name: "TransGlobal", code: "TGL", email: "admin@transglobal.com", password: "transglobal123", assignedAirports: ["JFK", "MIA", "LAX", "LHR", "NRT", "DXB"] },
  { id: "AL-005", name: "PacificAir", code: "PAC", email: "contact@pacificair.com", password: "pacificair123", assignedAirports: ["LAX", "NRT", "SIN", "BKK", "ICN"] },
  { id: "AL-006", name: "AtlanticJet", code: "ATJ", email: "info@atlanticjet.com", password: "atlanticjet123", assignedAirports: ["JFK", "MIA", "MAD", "CDG", "LHR"] },
  { id: "AL-007", name: "NordStar", code: "NDS", email: "ops@nordstar.eu", password: "nordstar123", assignedAirports: ["YYZ", "FRA", "AMS", "LHR"] },
  { id: "AL-008", name: "SunAirways", code: "SNA", email: "hello@sunairways.com", password: "sunairways123", assignedAirports: ["MEX", "MIA", "BOG", "LIM"] },
  { id: "AL-009", name: "EagleFlights", code: "EGF", email: "ops@eagleflights.com", password: "eagleflights123", assignedAirports: ["JFK", "LAX", "YYZ", "MEX"] },
  { id: "AL-010", name: "OrionAir", code: "ORA", email: "contact@orionair.ae", password: "orionair123", assignedAirports: ["DXB", "DEL", "SIN", "PEK"] },
];

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => {
    try {
      const saved = localStorage.getItem("suitchase_sim_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.running = false; // Don't auto-resume on reload
        if (parsed.startTime === undefined) parsed.startTime = 0;
        // Validate essential fields
        if (!parsed.airports || !parsed.flights || !parsed.stats || !parsed.baggageGroups) {
          throw new Error("Invalid state");
        }
        return parsed;
      }
    } catch {
      localStorage.removeItem("suitchase_sim_state");
    }
    return createInitialState("weekly", 1);
  });
  const [events, setEvents] = useState<SimEvent[]>(() => {
    try {
      const saved = localStorage.getItem("suitchase_sim_events");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [speed, setSpeed] = useState(1);
  const [airportsList, setAirportsList] = useState<Airport[]>(() => {
    try {
      const saved = localStorage.getItem("suitchase_airports");
      if (saved) {
        const parsed = JSON.parse(saved) as Airport[];
        // Migrate: add timezone if missing from old data
        return parsed.map(a => ({
          ...a,
          timezone: a.timezone || "UTC+0",
        }));
      }
    } catch {}
    return [...DEFAULT_AIRPORTS];
  });
  const [airlines, setAirlines] = useState<Airline[]>(() => {
    try {
      const saved = localStorage.getItem("suitchase_airlines");
      if (saved) {
        const parsed = JSON.parse(saved) as Airline[];
        // Migrate: add email/password if missing from old data
        return parsed.map(a => ({
          ...a,
          email: a.email || "",
          password: a.password || "",
        }));
      }
    } catch {}
    return DEFAULT_AIRLINES;
  });
  const intervalRef = useRef<number | null>(null);
  const prevCollapsed = useRef(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const alertedAirports = useRef<Set<string>>(new Set());

  // Notify on collapse
  useEffect(() => {
    if (state.collapsed && !prevCollapsed.current) {
      toast.error(`SISTEMA COLAPSADO: ${state.collapseReason}`, {
        duration: 10000,
        style: { background: "#7f1d1d", border: "1px solid #ef4444", color: "#fecaca" },
      });
      // Simulated email alert for collapse
      toast("Alerta enviada por correo electrónico a administradores (simulada)", {
        duration: 5000,
        style: { background: "#1e293b", border: "1px solid #f59e0b", color: "#fcd34d" },
      });
    }
    prevCollapsed.current = state.collapsed;
  }, [state.collapsed, state.collapseReason]);

  // Saturation alerts (>80%)
  useEffect(() => {
    if (!state.running) return;
    for (const code in state.airports) {
      const ap = state.airports[code];
      const pct = ap.capacity > 0 ? (ap.currentStock / ap.capacity) * 100 : 0;
      if (pct > 80 && !alertedAirports.current.has(code)) {
        alertedAirports.current.add(code);
        toast.warning(`Aeropuerto ${code} saturado (${pct.toFixed(0)}%) — Alerta por correo simulada`, {
          duration: 6000,
          style: { background: "#1e293b", border: "1px solid #f59e0b", color: "#fcd34d" },
        });
      } else if (pct <= 80) {
        alertedAirports.current.delete(code);
      }
    }
  }, [state.airports, state.running]);

  const start = useCallback((scenario: "daily" | "weekly" | "collapse", turnaroundHours: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const initial = createInitialState(scenario, turnaroundHours);
    initial.running = true;
    initial.speed = speed;
    setState(initial);
    setEvents([]);
  }, [speed]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, running: false, stopped: true } as any));
  }, []);

  const reset = useCallback((scenario: "daily" | "weekly" | "collapse", turnaroundHours: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const initial = createInitialState(scenario, turnaroundHours);
    initial.running = false;
    initial.speed = speed;
    setState(initial);
    setEvents([]);
  }, [speed]);

  const togglePause = useCallback(() => {
    setState(prev => {
      if (prev.running) {
        // Pausing
        return { ...prev, running: false };
      } else {
        // Resuming/Starting — record startTime if first start
        return {
          ...prev,
          running: true,
          startTime: prev.startTime === 0 && prev.currentTime > 0 ? prev.currentTime : prev.startTime || prev.currentTime,
        };
      }
    });
  }, []);

  const updateSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    setState(prev => ({ ...prev, speed: newSpeed }));
  }, []);

  const handleCancelFlight = useCallback((flightId: string) => {
    setState(prev => {
      const result = cancelFlight(prev, flightId);
      setEvents(e => [...e, ...result.events]);
      return result.state;
    });
  }, []);

  const registerBaggage = useCallback((origin: string, destination: string, quantity: number, airline: string) => {
    setState(prev => {
      const deadlineHours = getDeadlineHours(origin, destination);
      const route = planRoute(origin, destination, prev.currentTime, prev.currentTime + deadlineHours, prev.turnaroundHours, prev.flights);

      const bg: BaggageGroup = {
        id: `BG-${String(Date.now()).slice(-6)}`,
        airline,
        origin,
        destination,
        quantity,
        registeredAt: prev.currentTime,
        deadlineAt: prev.currentTime + deadlineHours,
        currentLocation: origin,
        status: "waiting",
        route: route || [],
        currentLegIndex: 0,
      };

      const newAirports = { ...prev.airports };
      if (newAirports[origin]) {
        newAirports[origin] = {
          ...newAirports[origin],
          currentStock: newAirports[origin].currentStock + quantity,
        };
      }

      const event: SimEvent = {
        time: prev.currentTime,
        type: "register",
        description: `${quantity} maletas registradas manualmente: ${origin}→${destination} (${airline})`,
      };
      setEvents(e => [...e, event]);

      return {
        ...prev,
        baggageGroups: [...prev.baggageGroups, bg],
        airports: newAirports,
        stats: { ...prev.stats, totalRegistered: prev.stats.totalRegistered + quantity },
      };
    });
  }, []);

  // Batch import baggage
  const batchImportBaggage = useCallback((items: { origin: string; destination: string; quantity: number; airline: string }[]) => {
    let count = 0;
    setState(prev => {
      let next = { ...prev };
      next.baggageGroups = [...prev.baggageGroups];
      next.airports = { ...prev.airports };
      next.stats = { ...prev.stats };
      const newEvents: SimEvent[] = [];

      for (const item of items) {
        const deadlineHours = getDeadlineHours(item.origin, item.destination);
        const route = planRoute(item.origin, item.destination, next.currentTime, next.currentTime + deadlineHours, next.turnaroundHours, next.flights);
        const bg: BaggageGroup = {
          id: `BG-${String(Date.now()).slice(-6)}-${count}`,
          airline: item.airline,
          origin: item.origin,
          destination: item.destination,
          quantity: item.quantity,
          registeredAt: next.currentTime,
          deadlineAt: next.currentTime + deadlineHours,
          currentLocation: item.origin,
          status: "waiting",
          route: route || [],
          currentLegIndex: 0,
        };
        next.baggageGroups.push(bg);
        if (next.airports[item.origin]) {
          next.airports[item.origin] = {
            ...next.airports[item.origin],
            currentStock: next.airports[item.origin].currentStock + item.quantity,
          };
        }
        next.stats.totalRegistered += item.quantity;
        count++;
        newEvents.push({
          time: next.currentTime,
          type: "register",
          description: `${item.quantity} maletas importadas: ${item.origin}→${item.destination} (${item.airline})`,
        });
      }
      setEvents(e => [...e, ...newEvents]);
      return next;
    });
    return count;
  }, []);

  const batchImportFlights = useCallback((lines: string[]) => {
    let count = 0;
    setState(prev => {
      const next = { ...prev };
      next.flights = [...prev.flights];
      const newEvents: SimEvent[] = [];

      for (const line of lines) {
        const parts = line.split('-');
        if (parts.length >= 5) {
          const origin = parts[0].trim();
          const dest = parts[1].trim();
          const depTimeStr = parts[2].trim();
          const arrTimeStr = parts[3].trim();
          const durationStr = parts[4].trim();

          // Parse HH:MM
          const depParts = depTimeStr.split(':');
          let depHour = 0;
          if (depParts.length >= 2) {
            depHour = parseInt(depParts[0], 10) + parseInt(depParts[1], 10) / 60;
          }

          // Parse duration HHMM
          let durationHours = 0;
          if (durationStr.length >= 3) {
            const h = parseInt(durationStr.slice(0, -2), 10);
            const m = parseInt(durationStr.slice(-2), 10);
            durationHours = h + m / 60;
          } else {
            durationHours = parseInt(durationStr, 10);
          }

          next.flights.push({
            id: `FI-${Date.now()}-${count}`,
            origin,
            destination: dest,
            departureHour: depHour,
            capacity: 250, // default
            currentLoad: 0,
            cancelled: false,
            intercontinental: durationHours > 6, // rough estimate
            transitHours: durationHours
          });
          count++;
        }
      }
      newEvents.push({
        time: next.currentTime,
        type: "system",
        description: `Se importaron ${count} vuelos en lote.`,
      });
      setEvents(e => [...e, ...newEvents]);
      return next;
    });
    toast.success(`${count} vuelos importados exitosamente`);
    return count;
  }, []);

  const batchImportAirports = useCallback((lines: string[]) => {
    let count = 0;
    const newAirportsList = [...DEFAULT_AIRPORTS];
    
    setState(prev => {
      const next = { ...prev };
      next.airports = { ...prev.airports };
      const newEvents: SimEvent[] = [];

      for (const line of lines) {
        const match = line.match(/^\d+\s+([A-Z]{4})\s+(.+?)\s{2,}(.+?)\s{2,}([a-z]+)\s+([+-]?\d+)\s+(\d+)\s+Latitude:\s*(.+?)\s+Longitude:\s*(.+)$/i);
        if (match) {
          const code = match[1];
          const city = match[2].trim();
          const country = match[3].trim();
          const capacity = parseInt(match[6], 10);
          
          let latMatch = match[7].match(/(\d+)°\s*(\d+)'\s*(\d+)"\s*([NS])/);
          let lonMatch = match[8].match(/(\d+)°\s*(\d+)'\s*(\d+)"\s*([EW])/);
          
          let lat = 0, lon = 0;
          if (latMatch) {
            lat = parseInt(latMatch[1]) + parseInt(latMatch[2])/60 + parseInt(latMatch[3])/3600;
            if (latMatch[4] === 'S') lat = -lat;
          }
          if (lonMatch) {
            lon = parseInt(lonMatch[1]) + parseInt(lonMatch[2])/60 + parseInt(lonMatch[3])/3600;
            if (lonMatch[4] === 'W') lon = -lon;
          }

          const continent = lat < 15 && lon < -30 ? "America" : (lat > 35 && lon > -10 && lon < 40 ? "Europa" : "Asia");

          const tzOffset = parseInt(match[5], 10);
          const timezone = `UTC${tzOffset >= 0 ? "+" : ""}${tzOffset}`;

          const newAirport: import("../data/airports").Airport = {
            code,
            city,
            country,
            continent: continent as any,
            timezone,
            lat,
            lng: lon,
            warehouseCapacity: capacity,
            currentStock: 0,
          };

          const existingIdx = newAirportsList.findIndex(a => a.code === code);
          if (existingIdx >= 0) {
            newAirportsList[existingIdx] = newAirport;
          } else {
            newAirportsList.push(newAirport);
          }

          next.airports[code] = {
            code,
            currentStock: next.airports[code]?.currentStock || 0,
            capacity: capacity,
            incoming: next.airports[code]?.incoming || 0,
            outgoing: next.airports[code]?.outgoing || 0,
          };
          count++;
        }
      }
      
      setAirportsList(newAirportsList);
      DEFAULT_AIRPORTS.splice(0, DEFAULT_AIRPORTS.length, ...newAirportsList);

      if (count > 0) {
        newEvents.push({
          time: next.currentTime,
          type: "system",
          description: `Se importaron/actualizaron ${count} aeropuertos en lote.`,
        });
      }
      setEvents(e => [...e, ...newEvents]);
      return next;
    });
    toast.success(`${count} aeropuertos importados exitosamente`);
    return count;
  }, []);

  // Airport CRUD
  const addAirport = useCallback((airport: Airport) => {
    DEFAULT_AIRPORTS.push(airport);
    setAirportsList(prev => [...prev, airport]);
    setState(prev => ({
      ...prev,
      airports: {
        ...prev.airports,
        [airport.code]: { code: airport.code, currentStock: 0, capacity: airport.warehouseCapacity, incoming: 0, outgoing: 0 },
      },
    }));
    toast.success(`Aeropuerto ${airport.code} (${airport.city}) agregado`);
  }, []);

  const updateAirport = useCallback((code: string, updates: Partial<Airport>) => {
    const idx = DEFAULT_AIRPORTS.findIndex(a => a.code === code);
    if (idx >= 0) Object.assign(DEFAULT_AIRPORTS[idx], updates);
    setAirportsList(prev => prev.map(a => a.code === code ? { ...a, ...updates } : a));
    if (updates.warehouseCapacity !== undefined) {
      setState(prev => {
        if (!prev.airports[code]) return prev;
        return {
          ...prev,
          airports: {
            ...prev.airports,
            [code]: { ...prev.airports[code], capacity: updates.warehouseCapacity! },
          },
        };
      });
    }
    toast.success(`Aeropuerto ${code} actualizado`);
  }, []);

  const deleteAirport = useCallback((code: string) => {
    const idx = DEFAULT_AIRPORTS.findIndex(a => a.code === code);
    if (idx >= 0) DEFAULT_AIRPORTS.splice(idx, 1);
    setAirportsList(prev => prev.filter(a => a.code !== code));
    setState(prev => {
      const newAirports = { ...prev.airports };
      delete newAirports[code];
      return { ...prev, airports: newAirports };
    });
    toast.success(`Aeropuerto ${code} eliminado`);
  }, []);

  // Airline CRUD
  const addAirline = useCallback((airline: Airline) => {
    setAirlines(prev => [...prev, airline]);
    toast.success(`Aerolínea ${airline.name} agregada`);
  }, []);

  const updateAirline = useCallback((id: string, updates: Partial<Airline>) => {
    setAirlines(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    toast.success(`Aerolínea actualizada`);
  }, []);

  const deleteAirline = useCallback((code: string) => {
    setAirlines(prev => prev.filter(a => a.id !== code));
    toast.success(`Aerolínea eliminada`);
  }, []);

  const seekTo = useCallback((day: number, hour: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => {
      const newTime = Math.max(0, (day - 1) * 24 + hour);
      // Reset simulation data but keep config (scenario, flights, airports structure, speed)
      const resetAirports: Record<string, typeof prev.airports[string]> = {};
      for (const code in prev.airports) {
        resetAirports[code] = { ...prev.airports[code], currentStock: 0, incoming: 0, outgoing: 0 };
      }
      return {
        ...prev,
        currentTime: newTime,
        startTime: newTime,
        day,
        hour,
        running: false,
        collapsed: false,
        collapseReason: "",
        baggageGroups: [],
        airports: resetAirports,
        stats: createEmptyStats(),
      };
    });
    setEvents([]);
  }, []);

  const setScenario = useCallback((scenario: "daily" | "weekly" | "collapse") => {
    setState(prev => ({ ...prev, scenario }));
  }, []);

  const clearFlights = () => {
    setState(prev => ({ ...prev, flights: [] }));
  };

  // Main simulation loop
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!state.running || state.collapsed) return;

    const tick = () => {
      const currentSpeed = speedRef.current;
      const dt = 0.5 * Math.max(1, currentSpeed / 2);

      setState(prev => {
        if (!prev.running || prev.collapsed) return prev;

        const maxDuration = prev.scenario === "weekly" ? 120 : prev.scenario === "daily" ? 24 : 4320;
        const elapsed = prev.currentTime - (prev.startTime || 0);
        if (elapsed >= maxDuration) {
          return { ...prev, running: false };
        }

        const result = simulateStep(prev, dt);
        setEvents(e => [...e.slice(-200), ...result.events]);
        return result.state;
      });
    };

    const getInterval = () => Math.max(16, 200 / speedRef.current);
    
    let timeoutId: number;
    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        tick();
        scheduleNext();
      }, getInterval());
    };
    scheduleNext();

    intervalRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state.running, state.collapsed]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("suitchase_sim_state", JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem("suitchase_sim_events", JSON.stringify(events.slice(-200)));
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem("suitchase_airports", JSON.stringify(airportsList));
    } catch {}
  }, [airportsList]);

  useEffect(() => {
    try {
      localStorage.setItem("suitchase_airlines", JSON.stringify(airlines));
    } catch {}
  }, [airlines]);

  return {
    state,
    events,
    airportsList,
    airlines,
    start,
    stop,
    reset,
    togglePause,
    updateSpeed,
    cancelFlight: handleCancelFlight,
    clearFlights,
    registerBaggage,
    batchImportBaggage,
    batchImportFlights,
    batchImportAirports,
    addAirport,
    updateAirport,
    deleteAirport,
    addAirline,
    updateAirline,
    deleteAirline,
    seekTo,
    setScenario,
  };
}