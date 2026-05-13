package com.tasf.b2b.core;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Encapsula la soluciÃ³n de planificaciÃ³n producida por cualquiera de los
 * dos algoritmos (AG o ACS).
 *
 * Mapea cada EnvioAlgoritmo a su ResultadoRuta calculado, junto con
 * mÃ©tricas de calidad de la soluciÃ³n.
 */
public class PlanificationSolutionOutput {

    /** Mapa de (origenOaci + "-" + idEnvio) -> ResultadoRuta */
    private final Map<String, ResultadoRuta> mapaRutas;

    /** Lista de envÃ­os en el orden en que fueron planificados */
    private final List<EnvioAlgoritmo> enviosPlanificados;

    /** Estado de capacidades de vuelos al final de este bloque */
    private final Map<String, Integer> estadoCapacidadesVuelos;

    /** Estado de ocupaciÃ³n de almacenes al final de este bloque */
    private final Map<String, int[]> estadoOcupacionAlmacenes;

    private double promedioConsumoSLA;
    private double ocupacionVuelosPonderada;
    private double ocupacionAlmacenesPonderada;
    private int capacidadTotalAlmacenes;

    /** Nombre del algoritmo que generÃ³ esta soluciÃ³n */
    private String algoritmo;

    public PlanificationSolutionOutput(String algoritmo) {
        this.algoritmo               = algoritmo;
        this.mapaRutas               = new LinkedHashMap<>();
        this.enviosPlanificados      = new ArrayList<>();
        this.estadoCapacidadesVuelos = new HashMap<>();
        this.estadoOcupacionAlmacenes = new HashMap<>();
        this.promedioConsumoSLA = Double.MAX_VALUE;
    }

    // ---- Rutas ----

    public void agregarRuta(EnvioAlgoritmo envio, ResultadoRuta ruta) {
        String clave = envio.getOrigenOaci() + "-" + envio.getId();
        mapaRutas.put(clave, ruta);
        if (!enviosPlanificados.contains(envio)) {
            enviosPlanificados.add(envio);
        }
    }

    public ResultadoRuta getRuta(EnvioAlgoritmo envio) {
        return mapaRutas.get(envio.getOrigenOaci() + "-" + envio.getId());
    }

    public Map<String, ResultadoRuta> getMapaRutas() {
        return mapaRutas;
    }

    public List<EnvioAlgoritmo> getEnviosPlanificados() {
        return enviosPlanificados;
    }

    // ---- Capacidades y almacenes ----

    public void setEstadoCapacidadesVuelos(Map<String, Integer> estado) {
        this.estadoCapacidadesVuelos.putAll(estado);
    }

    public void setEstadoOcupacionAlmacenes(Map<String, int[]> estado) {
        this.estadoOcupacionAlmacenes.putAll(estado);
    }

    public Map<String, Integer> getEstadoCapacidadesVuelos() {
        return estadoCapacidadesVuelos;
    }

    public Map<String, int[]> getEstadoOcupacionAlmacenes() {
        return estadoOcupacionAlmacenes;
    }

    // ---- MÃ©trica unificada ----

    /**
     * Calcula y almacena la mÃ©trica de calidad unificada para ambos algoritmos:
     *
     *   mÃ©trica = promedio de [ (horaLlegada âˆ’ horaRegistro) / SLA ]
     *
     * donde SLA = 24h (1440 min) para mismo continente, 48h (2880 min) para distinto.
     *
     * InterpretaciÃ³n:
     *   0.0  â†’ entregas instantÃ¡neas (imposible en prÃ¡ctica)
     *   < 1.0 â†’ todos los envÃ­os dentro del SLA (mejor zona)
     *   = 1.0 â†’ todos los envÃ­os llegaron exactamente en el lÃ­mite del SLA
     *   > 1.0 â†’ hay envÃ­os que superaron el SLA (zona de colapso)
     *
     * Solo se incluyen envÃ­os que tienen ruta y alcanzaron su destino.
     * Menor valor = mejor soluciÃ³n, y es directamente comparable entre AG y ACS.
     *
     * @param mapaAeropuertos Necesario para determinar el continente de origen y destino.
     */
    public void calcularPromedioConsumoSLA(java.util.Map<String, AeropuertoAlgoritmo> mapaAeropuertos) {
        double sumaRatio = 0.0;
        int    conteo    = 0;

        for (EnvioAlgoritmo envio : enviosPlanificados) {
            ResultadoRuta ruta = getRuta(envio);
            if (ruta == null) continue;

            // Solo envÃ­os que llegaron al destino correcto
            if (ruta.vuelosUsados.isEmpty()) continue;
            String destinoAlcanzado =
                    ruta.vuelosUsados.get(ruta.vuelosUsados.size() - 1).getDestinoOaci();
            if (!destinoAlcanzado.equals(envio.getDestinoOaci())) continue;

            // Determinar SLA segÃºn continentes
            AeropuertoAlgoritmo aOrig = mapaAeropuertos.get(envio.getOrigenOaci());
            AeropuertoAlgoritmo aDest = mapaAeropuertos.get(envio.getDestinoOaci());
            int slaMinutos = (aOrig != null && aDest != null &&
                    aOrig.getContinente().equalsIgnoreCase(aDest.getContinente()))
                    ? 24 * 60   // 1440 min â€” mismo continente
                    : 48 * 60;  // 2880 min â€” distinto continente

            long minutos = java.time.temporal.ChronoUnit.MINUTES.between(
                    envio.getFechaHoraRegistro(), ruta.tiempoLlegadaFinal);

            sumaRatio += (double) minutos / slaMinutos;
            conteo++;
        }

        this.promedioConsumoSLA = conteo > 0 ? sumaRatio * 100 / conteo : Double.MAX_VALUE;
    }

    /**
     * Calcula las mÃ©tricas de ocupaciÃ³n de forma ponderada.
     * @param indiceVuelos Un mapa de clave -> VueloAlgoritmo para obtener capacidades mÃ¡ximas.
     * @param mapaAeropuertos Para obtener capacidades de almacÃ©n.
     * @param horaBase Hora de inicio del bloque actual.
     * @param saltoSc Ventana de tiempo (minutos).
     */
    public void calcularEstadisticasOcupacion(Map<String, VueloAlgoritmo> indiceVuelos,
                                             Map<String, AeropuertoAlgoritmo> mapaAeropuertos,
                                             LocalDateTime horaBase,
                                             int saltoSc) {
        
        // 1. OCUPACIÃ“N DE VUELOS (Ponderada por capacidad mÃ¡xima)
        long totalCapUsada = 0;
        long totalCapMaxVuelos = 0;

        for (Map.Entry<String, Integer> entry : estadoCapacidadesVuelos.entrySet()) {
            VueloAlgoritmo v = indiceVuelos.get(entry.getKey());
            if (v != null) {
                totalCapUsada += entry.getValue();
                totalCapMaxVuelos += v.getCapacidad();
            }
        }
        
        this.ocupacionVuelosPonderada = (totalCapMaxVuelos > 0) ? (double) totalCapUsada / totalCapMaxVuelos : 0;

        // 2. OCUPACIÃ“N DE ALMACENES (Promedio temporal ponderado por capacidad)
        int idxInicio = TimeUtils.getIndiceMinuto(horaBase);
        int idxFin = idxInicio + saltoSc;
        
        double sumaUsosPromedio = 0;
        long sumaCapacidadesAlmacen = 0;

        for (Map.Entry<String, int[]> entry : estadoOcupacionAlmacenes.entrySet()) {
            AeropuertoAlgoritmo aero = mapaAeropuertos.get(entry.getKey());
            if (aero == null || aero.getCapacidadAlmacen() == 0) continue;

            int[] usoPorMinuto = entry.getValue();
            long sumaUsoEnVentana = 0;
            int minutosContados = 0;

            for (int i = idxInicio; i < idxFin && i < usoPorMinuto.length; i++) {
                sumaUsoEnVentana += usoPorMinuto[i];
                minutosContados++;
            }

            if (minutosContados > 0) {
                double usoPromedioTemporal = (double) sumaUsoEnVentana / minutosContados;
                sumaUsosPromedio += usoPromedioTemporal;
                sumaCapacidadesAlmacen += aero.getCapacidadAlmacen();
            }
        }
        this.ocupacionAlmacenesPonderada = (sumaCapacidadesAlmacen > 0) ? sumaUsosPromedio / sumaCapacidadesAlmacen : 0;
        this.capacidadTotalAlmacenes += sumaCapacidadesAlmacen;
    }

    // Getters para las nuevas mÃ©tricas
    public double getOcupacionVuelosPonderada() { return ocupacionVuelosPonderada; }
    public double getOcupacionAlmacenesPonderada() { return ocupacionAlmacenesPonderada; }

    public double getPromedioConsumoSLA() { return promedioConsumoSLA; }
    public void setPromedioConsumoSLA(double m) { this.promedioConsumoSLA = m; }

    public int getCapacidadTotalAlmacenes() { return capacidadTotalAlmacenes; }

    public String getAlgoritmo() { return algoritmo; }

    // ---- EstadÃ­sticas rÃ¡pidas ----

    public int totalEnvios() {
        return enviosPlanificados.size();
    }

    public long totalMaletas() {
        return enviosPlanificados.stream()
                .mapToLong(EnvioAlgoritmo::getCantidadMaletas).sum();
    }

    public int enviosConRuta() {
        return (int) enviosPlanificados.stream()
                .filter(e -> getRuta(e) != null).count();
    }
}

