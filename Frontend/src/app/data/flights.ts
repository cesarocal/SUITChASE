import { AIRPORTS, isSameContinent, getAirportByCode } from "./airports";

export interface FlightSchedule {
  id: string;
  origin: string;
  destination: string;
  departureHour: number; // 0-23
  capacity: number;
  intercontinental: boolean;
  cancelled: boolean;
}

function generateFlights(): FlightSchedule[] {
  const flights: FlightSchedule[] = [];
  let id = 1;

  const continents = ["America", "Europa", "Asia"] as const;

  // Intra-continental flights (1-3 per day between cities)
  for (const cont of continents) {
    const cities = AIRPORTS.filter(a => a.continent === cont);
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const numFlights = 1 + Math.floor(Math.random() * 2); // 1-2 flights
        for (let f = 0; f < numFlights; f++) {
          const hour = Math.floor((24 / numFlights) * f + Math.random() * 4);
          const cap = 1500 + Math.floor(Math.random() * 1001); // 1500-2500
          flights.push({
            id: `F${String(id++).padStart(4, "0")}`,
            origin: cities[i].code,
            destination: cities[j].code,
            departureHour: hour % 24,
            capacity: cap,
            intercontinental: false,
            cancelled: false,
          });
          // Return flight
          flights.push({
            id: `F${String(id++).padStart(4, "0")}`,
            origin: cities[j].code,
            destination: cities[i].code,
            departureHour: (hour + 6) % 24,
            capacity: cap,
            intercontinental: false,
            cancelled: false,
          });
        }
      }
    }
  }

  // Inter-continental hub flights
  const hubs: Record<string, string[]> = {
    America: ["MIA", "JFK", "GRU", "LAX"],
    Europa: ["LHR", "CDG", "FRA", "MAD"],
    Asia: ["NRT", "SIN", "DXB", "PEK"],
  };

  const contPairs = [
    ["America", "Europa"],
    ["America", "Asia"],
    ["Europa", "Asia"],
  ];

  for (const [c1, c2] of contPairs) {
    const h1 = hubs[c1];
    const h2 = hubs[c2];
    for (const a of h1) {
      for (const b of h2) {
        const hour = Math.floor(Math.random() * 24);
        const cap = 1500 + Math.floor(Math.random() * 2501); // 1500-4000
        flights.push({
          id: `F${String(id++).padStart(4, "0")}`,
          origin: a,
          destination: b,
          departureHour: hour,
          capacity: cap,
          intercontinental: true,
          cancelled: false,
        });
        flights.push({
          id: `F${String(id++).padStart(4, "0")}`,
          origin: b,
          destination: a,
          departureHour: (hour + 12) % 24,
          capacity: cap,
          intercontinental: true,
          cancelled: false,
        });
      }
    }
  }

  return flights;
}

export const FLIGHT_SCHEDULES: FlightSchedule[] = generateFlights();

export function getFlightsFrom(origin: string): FlightSchedule[] {
  return FLIGHT_SCHEDULES.filter(f => f.origin === origin && !f.cancelled);
}

export function getTransitTimeHours(originCode: string, destCode: string): number {
  const a = getAirportByCode(originCode);
  const b = getAirportByCode(destCode);
  if (!a || !b) return 24;
  return isSameContinent(a, b) ? 12 : 24;
}

export function getDeadlineHours(originCode: string, destCode: string): number {
  const a = getAirportByCode(originCode);
  const b = getAirportByCode(destCode);
  if (!a || !b) return 480;
  return isSameContinent(a, b) ? 240 : 480;
}
