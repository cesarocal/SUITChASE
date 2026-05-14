import { BaggageGroup, FlightState, SimStats, AirportState } from "./types";
import { AIRPORTS } from "../data/airports";
import { FLIGHT_SCHEDULES } from "../data/flights";

export function mapBlockResultToBaggageGroups(
  rutasResumen: any[],
  currentTime: number,
  currentBaggageGroups: BaggageGroup[]
): BaggageGroup[] {
  const newGroups: BaggageGroup[] = rutasResumen.map((resumen) => {
    const route = [];
    if (resumen.estado === "CON_RUTA" && resumen.primerTramo && resumen.ultimoTramo) {
      const [from1, to1] = resumen.primerTramo.split("→");
      route.push({
        from: from1,
        to: to1,
        departureTime: new Date(resumen.salidaPrimer || currentTime).getTime(),
        arrivalTime: new Date(resumen.llegadaFinal || currentTime).getTime(),
        flightId: "BACKEND-FLIGHT",
        transitHours: 0,
      });

      if (resumen.primerTramo !== resumen.ultimoTramo) {
        const [from2, to2] = resumen.ultimoTramo.split("→");
        route.push({
          from: from2,
          to: to2,
          departureTime: new Date(resumen.llegadaFinal || currentTime).getTime() - 3600000, // fake time
          arrivalTime: new Date(resumen.llegadaFinal || currentTime).getTime(),
          flightId: "BACKEND-FLIGHT-2",
          transitHours: 0,
        });
      }
    }

    return {
      id: resumen.envioId,
      airline: "BackendAirline",
      origin: resumen.origen,
      destination: resumen.destino,
      quantity: resumen.maletas,
      registeredAt: currentTime,
      deadlineAt: currentTime + 48 * 3600 * 1000,
      currentLocation: resumen.origen,
      status: resumen.estado === "CON_RUTA" ? "in_transit" : "failed",
      route: route,
      currentLegIndex: 0,
    } as BaggageGroup;
  });

  return newGroups;
}

export function updateStatsFromMetrics(
  metricas: any,
  currentStats: SimStats
): SimStats {
  return {
    ...currentStats,
    totalRegistered: currentStats.totalRegistered + metricas.totalEnvios,
    totalDelivered: currentStats.totalDelivered + metricas.enviosConRuta,
    totalFailed: currentStats.totalFailed + metricas.enviosSinRuta,
    onTimeRate: metricas.sla || currentStats.onTimeRate,
    warehouseUtilization: metricas.ocupacionAlmacenes || currentStats.warehouseUtilization,
    flightUtilization: metricas.ocupacionVuelos || currentStats.flightUtilization,
  };
}
