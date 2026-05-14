import { useState, useRef, useCallback, useEffect } from "react";
import { createEmptyStats } from "./simulation";
import { AIRPORTS as DEFAULT_AIRPORTS, type Airport } from "../data/airports";
import type { SimulationState, SimEvent, Airline } from "./types";
import { SIM_BASE_DATE } from "./types";
import { toast } from "sonner";
import { api } from "../services/api";
import { SimulationWebSocketClient } from "../services/websocket";
import { mapBlockResultToBaggageGroups, updateStatsFromMetrics } from "./backendAdapter";

const DEFAULT_AIRLINES: Airline[] = [
  { id: "AL-001", name: "AeroLatam", code: "ALT", email: "contacto@aerolatam.com", password: "aerolatam123", assignedAirports: ["GRU", "EZE", "BOG", "LIM", "SCL"] },
  // ... (keep the same if you want, or just a few for mock)
];

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => {
    return {
      scenario: "weekly",
      turnaroundHours: 1,
      currentTime: SIM_BASE_DATE.getTime(),
      startTime: SIM_BASE_DATE.getTime(),
      day: 1,
      hour: 0,
      airports: {},
      flights: [],
      baggageGroups: [],
      stats: createEmptyStats(),
      collapsed: false,
      collapseReason: "",
      running: false,
      stopped: false,
      hasStarted: false,
      speed: 4, // Represents K
    };
  });

  const [events, setEvents] = useState<SimEvent[]>([]);
  const [speed, setSpeed] = useState(4); // Default K=4
  const [airportsList, setAirportsList] = useState<Airport[]>(DEFAULT_AIRPORTS);
  const [airlines, setAirlines] = useState<Airline[]>(DEFAULT_AIRLINES);
  
  const wsClientRef = useRef<SimulationWebSocketClient | null>(null);
  const activeSimIdRef = useRef<number | null>(null);
  const prevCollapsed = useRef(false);

  // Notify on collapse
  useEffect(() => {
    if (state.collapsed && !prevCollapsed.current) {
      toast.error(`SISTEMA COLAPSADO: ${state.collapseReason}`, {
        duration: 10000,
        style: { background: "#7f1d1d", border: "1px solid #ef4444", color: "#fecaca" },
      });
    }
    prevCollapsed.current = state.collapsed;
  }, [state.collapsed, state.collapseReason]);

  const connectWebSocket = useCallback((simId: number) => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }
    const ws = new SimulationWebSocketClient(simId);
    
    ws.onMessage((msg) => {
      setState(prev => {
        const cursorTime = new Date(msg.cursor).getTime();
        const startDay = new Date(prev.startTime).getTime();
        const diffHours = (cursorTime - startDay) / 3600000;
        
        let newGroups = prev.baggageGroups;
        let newStats = prev.stats;
        let newAirports = { ...prev.airports };
        
        if (msg.rutasResumen && msg.metricas) {
          const addedGroups = mapBlockResultToBaggageGroups(msg.rutasResumen, cursorTime, prev.baggageGroups);
          newGroups = [...prev.baggageGroups, ...addedGroups];
          newStats = updateStatsFromMetrics(msg.metricas, prev.stats);
        }

        // Just fake the airport stock for now based on stats
        for (const code of Object.keys(newAirports)) {
          if (newAirports[code]) {
            newAirports[code].currentStock = Math.floor(newAirports[code].capacity * (newStats.warehouseUtilization / 100));
          }
        }

        const isFinished = msg.estado === "FINALIZADA";
        
        return {
          ...prev,
          currentTime: cursorTime,
          day: Math.floor(diffHours / 24) + 1,
          hour: diffHours % 24,
          baggageGroups: newGroups,
          stats: newStats,
          airports: newAirports,
          running: msg.estado === "EJECUTANDO",
          stopped: isFinished || msg.estado === "CANCELADA",
        };
      });
    });

    ws.onConnect(() => {
      toast.success("Conectado a la simulación en tiempo real");
    });

    ws.connect();
    wsClientRef.current = ws;
  }, []);

  const start = useCallback(async (fechaInicio?: Date) => {
    const startDate = fechaInicio || SIM_BASE_DATE;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // 5 days

    try {
      const res = await api.iniciarSimulacion({
        nombre: `Simulación ${startDate.toISOString()}`,
        fechaInicio: startDate.toISOString(),
        fechaFin: endDate.toISOString(),
        sa: 30, // Fixed
        k: speed, // Modifiable via UI
        ta: 15 // Fixed
      });

      const simId = res.simulacionId;
      activeSimIdRef.current = simId;
      
      // Initialize state
      const initialAirports: Record<string, any> = {};
      DEFAULT_AIRPORTS.forEach(a => {
        initialAirports[a.code] = { code: a.code, currentStock: 0, capacity: a.warehouseCapacity, incoming: 0, outgoing: 0 };
      });

      setState({
        scenario: "weekly",
        turnaroundHours: 1,
        currentTime: startDate.getTime(),
        startTime: startDate.getTime(),
        day: 1,
        hour: 0,
        airports: initialAirports,
        flights: [],
        baggageGroups: [],
        stats: createEmptyStats(),
        collapsed: false,
        collapseReason: "",
        running: true,
        stopped: false,
        hasStarted: true,
        speed: speed,
      });
      setEvents([]);

      connectWebSocket(simId);
    } catch (error: any) {
      toast.error(`Error iniciando simulación: ${error.message}`);
    }
  }, [speed, connectWebSocket]);

  const stop = useCallback(async () => {
    if (activeSimIdRef.current) {
      try {
        await api.cancelarSimulacion(activeSimIdRef.current);
        setState(prev => ({ ...prev, running: false, stopped: true }));
        if (wsClientRef.current) wsClientRef.current.disconnect();
      } catch (error: any) {
        toast.error(`Error cancelando: ${error.message}`);
      }
    }
  }, []);

  const togglePause = useCallback(async () => {
    if (!activeSimIdRef.current) return;
    try {
      if (state.running) {
        await api.pausarSimulacion(activeSimIdRef.current);
        setState(prev => ({ ...prev, running: false }));
      } else {
        await api.reanudarSimulacion(activeSimIdRef.current);
        setState(prev => ({ ...prev, running: true }));
      }
    } catch (error: any) {
      toast.error(`Error pausando/reanudando: ${error.message}`);
    }
  }, [state.running]);

  const updateSpeed = useCallback(async (newSpeed: number) => {
    setSpeed(newSpeed);
    setState(prev => ({ ...prev, speed: newSpeed }));
    if (activeSimIdRef.current) {
      try {
        await api.actualizarK(activeSimIdRef.current, newSpeed);
        toast.success(`Velocidad (K) actualizada a ${newSpeed}`);
      } catch (error: any) {
        toast.error(`Error actualizando velocidad: ${error.message}`);
      }
    }
  }, []);

  const reset = useCallback(async () => {
    await stop();
    setState(prev => ({
      ...prev,
      currentTime: prev.startTime,
      day: 1,
      hour: 0,
      airports: {},
      flights: [],
      baggageGroups: [],
      stats: createEmptyStats(),
      collapsed: false,
      running: false,
      stopped: false,
    }));
  }, [stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  // Mocks for compatibility with other components
  const handleCancelFlight = useCallback((flightId: string) => {}, []);
  const registerBaggage = useCallback(() => {}, []);
  const batchImportBaggage = useCallback(() => 0, []);
  const batchImportFlights = useCallback(() => 0, []);
  const batchImportAirports = useCallback(() => 0, []);
  const addAirport = useCallback(() => {}, []);
  const updateAirport = useCallback(() => {}, []);
  const removeAirport = useCallback(() => {}, []);
  const addAirline = useCallback(() => {}, []);
  const updateAirline = useCallback(() => {}, []);
  const removeAirline = useCallback(() => {}, []);
  const setScenario = useCallback(() => {}, []);
  const confirmFastForward = useCallback(() => {}, []);
  const cancelFastForward = useCallback(() => {}, []);

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
    handleCancelFlight,
    registerBaggage,
    batchImportBaggage,
    batchImportFlights,
    batchImportAirports,
    addAirport,
    updateAirport,
    removeAirport,
    addAirline,
    updateAirline,
    removeAirline,
    setScenario,
    confirmFastForward,
    cancelFastForward,
  };
}