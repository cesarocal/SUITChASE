export interface Airport {
  code: string;
  city: string;
  country: string;
  continent: "America" | "Asia" | "Europa";
  timezone: string;
  lat: number;
  lng: number;
  warehouseCapacity: number;
  currentStock: number;
}

export const AIRPORTS: Airport[] = [
  // America
  { code: "GRU", city: "São Paulo", country: "Brasil", continent: "America", timezone: "UTC-3", lat: -23.55, lng: -46.63, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "EZE", city: "Buenos Aires", country: "Argentina", continent: "America", timezone: "UTC-3", lat: -34.6, lng: -58.38, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "BOG", city: "Bogotá", country: "Colombia", continent: "America", timezone: "UTC-5", lat: 4.71, lng: -74.07, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "MEX", city: "Ciudad de México", country: "México", continent: "America", timezone: "UTC-6", lat: 19.43, lng: -99.13, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "MIA", city: "Miami", country: "EEUU", continent: "America", timezone: "UTC-5", lat: 25.76, lng: -80.19, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "JFK", city: "Nueva York", country: "EEUU", continent: "America", timezone: "UTC-5", lat: 40.71, lng: -74.01, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "LAX", city: "Los Ángeles", country: "EEUU", continent: "America", timezone: "UTC-8", lat: 33.94, lng: -118.41, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "LIM", city: "Lima", country: "Perú", continent: "America", timezone: "UTC-5", lat: -12.05, lng: -77.04, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "SCL", city: "Santiago", country: "Chile", continent: "America", timezone: "UTC-4", lat: -33.45, lng: -70.67, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "YYZ", city: "Toronto", country: "Canadá", continent: "America", timezone: "UTC-5", lat: 43.65, lng: -79.38, warehouseCapacity: 5000000, currentStock: 0 },
  // Europa
  { code: "MAD", city: "Madrid", country: "España", continent: "Europa", timezone: "UTC+1", lat: 40.42, lng: -3.70, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "CDG", city: "París", country: "Francia", continent: "Europa", timezone: "UTC+1", lat: 48.86, lng: 2.35, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "FRA", city: "Fráncfort", country: "Alemania", continent: "Europa", timezone: "UTC+1", lat: 50.11, lng: 8.68, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "FCO", city: "Roma", country: "Italia", continent: "Europa", timezone: "UTC+1", lat: 41.90, lng: 12.50, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "LHR", city: "Londres", country: "Reino Unido", continent: "Europa", timezone: "UTC+0", lat: 51.51, lng: -0.13, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "AMS", city: "Ámsterdam", country: "Países Bajos", continent: "Europa", timezone: "UTC+1", lat: 52.37, lng: 4.90, warehouseCapacity: 5000000, currentStock: 0 },
  // Asia
  { code: "NRT", city: "Tokio", country: "Japón", continent: "Asia", timezone: "UTC+9", lat: 35.68, lng: 139.69, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "PEK", city: "Pekín", country: "China", continent: "Asia", timezone: "UTC+8", lat: 39.90, lng: 116.40, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "ICN", city: "Seúl", country: "Corea del Sur", continent: "Asia", timezone: "UTC+9", lat: 37.57, lng: 126.98, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "SIN", city: "Singapur", country: "Singapur", continent: "Asia", timezone: "UTC+8", lat: 1.35, lng: 103.82, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "BKK", city: "Bangkok", country: "Tailandia", continent: "Asia", timezone: "UTC+7", lat: 13.76, lng: 100.50, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "DEL", city: "Nueva Delhi", country: "India", continent: "Asia", timezone: "UTC+5:30", lat: 28.61, lng: 77.21, warehouseCapacity: 5000000, currentStock: 0 },
  { code: "DXB", city: "Dubái", country: "EAU", continent: "Asia", timezone: "UTC+4", lat: 25.20, lng: 55.27, warehouseCapacity: 5000000, currentStock: 0 },
];

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code === code);
}

export function isSameContinent(a: Airport, b: Airport): boolean {
  return a.continent === b.continent;
}