package com.tasf.b2b.service;

import com.tasf.b2b.core.*;
import com.tasf.b2b.domain.*;
import com.tasf.b2b.domain.SimulacionEntity.EstadoSimulacion;
import com.tasf.b2b.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final AeropuertoRepository aeropuertoRepository;
    private final VueloRepository vueloRepository;
    private final EnvioRepository envioRepository;
    private final SimulacionRepository simulacionRepository;
    private final BloqueResultadoRepository bloqueResultadoRepository;
    private final AsignacionEnvioRepository asignacionEnvioRepository;
    private final DataMapperService dataMapper;
    private final SimpMessagingTemplate messagingTemplate;

    // Estado de simulaciones activas: simulacionId -> flag de pausa
    private final Map<Long, Boolean> pauseFlags = new ConcurrentHashMap<>();

    // ========================================================
    // INICIAR SIMULACIÓN (llamado desde controller, retorna rápido)
    // ========================================================
    public SimulacionEntity iniciarSimulacion(Long userId, String nombre,
                                              LocalDateTime fechaInicio, LocalDateTime fechaFin,
                                              int sa, int k, int ta) {
        int sc = k * sa;
        long totalMinutos = ChronoUnit.MINUTES.between(fechaInicio, fechaFin);
        int totalBloques = (int) Math.ceil((double) totalMinutos / sa);

        SimulacionEntity sim = new SimulacionEntity();
        sim.setNombre(nombre);
        sim.setEstado(EstadoSimulacion.EJECUTANDO);
        sim.setFechaInicioSim(fechaInicio);
        sim.setFechaFinSim(fechaFin);
        sim.setSaltoAlgoritmoSa(sa);
        sim.setConstanteK(k);
        sim.setTiempoAlgoritmoTa(ta);
        sim.setBloqueActual(0);
        sim.setTotalBloquesEstimados(totalBloques);
        sim.setCursorTemporal(fechaInicio);
        sim.setCreadoPor(userId);

        simulacionRepository.save(sim);
        pauseFlags.put(sim.getId(), false);

        // Lanzar ejecución asíncrona
        ejecutarSimulacionAsync(sim.getId());

        return sim;
    }

    // ========================================================
    // PAUSAR
    // ========================================================
    public void pausarSimulacion(Long simulacionId) {
        pauseFlags.put(simulacionId, true);
        SimulacionEntity sim = simulacionRepository.findById(simulacionId)
                .orElseThrow(() -> new RuntimeException("Simulación no encontrada"));
        sim.setEstado(EstadoSimulacion.PAUSADA);
        simulacionRepository.save(sim);
        log.info("Simulación {} pausada", simulacionId);
    }

    // ========================================================
    // REANUDAR
    // ========================================================
    public void reanudarSimulacion(Long simulacionId) {
        SimulacionEntity sim = simulacionRepository.findById(simulacionId)
                .orElseThrow(() -> new RuntimeException("Simulación no encontrada"));

        if (sim.getEstado() != EstadoSimulacion.PAUSADA) {
            throw new RuntimeException("Solo se puede reanudar una simulación PAUSADA");
        }

        sim.setEstado(EstadoSimulacion.EJECUTANDO);
        simulacionRepository.save(sim);
        pauseFlags.put(simulacionId, false);

        // Relanzar el loop asíncrono desde donde se quedó
        ejecutarSimulacionAsync(simulacionId);
        log.info("Simulación {} reanudada desde bloque {}", simulacionId, sim.getBloqueActual());
    }

    // ========================================================
    // CANCELAR
    // ========================================================
    public void cancelarSimulacion(Long simulacionId) {
        pauseFlags.put(simulacionId, true);
        SimulacionEntity sim = simulacionRepository.findById(simulacionId)
                .orElseThrow(() -> new RuntimeException("Simulación no encontrada"));
        sim.setEstado(EstadoSimulacion.CANCELADA);
        simulacionRepository.save(sim);
        pauseFlags.remove(simulacionId);
        log.info("Simulación {} cancelada", simulacionId);
    }

    // ========================================================
    // LOOP ASÍNCRONO DE BLOQUES — el corazón del sistema
    // ========================================================
    @Async
    public void ejecutarSimulacionAsync(Long simulacionId) {
        SimulacionEntity sim = simulacionRepository.findById(simulacionId)
                .orElseThrow(() -> new RuntimeException("Simulación no encontrada"));

        int sa = sim.getSaltoAlgoritmoSa();
        int k  = sim.getConstanteK();
        int sc = k * sa;
        int ta = sim.getTiempoAlgoritmoTa();

        // Configurar TimeUtils para esta simulación
        TimeUtils.setFechaInicioSim(sim.getFechaInicioSim());
        TimeUtils.setFechaFinSim(sim.getFechaFinSim());

        // --- Cargar aeropuertos y vuelos (datos ligeros, se cargan una vez) ---
        List<AeropuertoAlgoritmo> aeropuertos = aeropuertoRepository.findAll().stream()
                .map(dataMapper::toAeropuertoAlgoritmo)
                .collect(Collectors.toList());

        List<VueloAlgoritmo> vuelos = vueloRepository.findAll().stream()
                .map(dataMapper::toVueloAlgoritmo)
                .collect(Collectors.toList());

        // Construir input maestro (aeropuertos + vuelos + estado global compartido)
        PlanificationProblemInput inputMaestro = new PlanificationProblemInput();
        aeropuertos.forEach(inputMaestro::agregarAeropuerto);
        vuelos.forEach(inputMaestro::agregarVuelo);

        // Cursor: posición actual en el tiempo simulado
        LocalDateTime cursor = sim.getCursorTemporal();
        int bloqueActual = sim.getBloqueActual();

        log.info("Simulación {} iniciada/reanudada. Cursor: {}, Bloque: {}/{}",
                simulacionId, cursor, bloqueActual, sim.getTotalBloquesEstimados());

        // ═══════════════════════════════════════════════════
        // LOOP DE BLOQUES
        // ═══════════════════════════════════════════════════
        while (cursor.isBefore(sim.getFechaFinSim())) {

            // ¿Se pidió pausa o cancelación?
            Boolean paused = pauseFlags.get(simulacionId);
            if (paused == null || paused) {
                log.info("Simulación {} detenida en bloque {}", simulacionId, bloqueActual);
                return; // Sale del hilo async, el estado ya está en PAUSADA/CANCELADA
            }

            LocalDateTime finVentana = cursor.plusMinutes(sc);
            if (finVentana.isAfter(sim.getFechaFinSim())) {
                finVentana = sim.getFechaFinSim();
            }

            // 1. QUERY A DB — solo envíos de este bloque (RAM-safe)
            List<EnvioAlgoritmo> enviosBloque = envioRepository
                    .findBySimulacionIdAndFechaHoraRegistroBetweenOrderByFechaHoraRegistroAsc(
                            simulacionId, cursor, finVentana)
                    .stream()
                    .map(dataMapper::toEnvioAlgoritmo)
                    .collect(Collectors.toList());

            bloqueActual++;
            long t0 = System.currentTimeMillis();

            BloqueResultadoEntity bloqueRes = new BloqueResultadoEntity();
            bloqueRes.setSimulacionId(simulacionId);
            bloqueRes.setNumeroBloque(bloqueActual);
            bloqueRes.setInicioVentana(cursor);
            bloqueRes.setFinVentana(finVentana);
            bloqueRes.setTotalEnvios(enviosBloque.size());

            if (!enviosBloque.isEmpty()) {
                // 2. Crear sub-input con los envíos del bloque
                PlanificationProblemInput subInput = inputMaestro.crearSubInput(enviosBloque);

                // 3. Ejecutar ACS
                long tiempoMs = (long) ta * 1000L;
                PlanificationSolutionOutput solucion = ACSAdapter.planificar(subInput, tiempoMs);

                long duracion = System.currentTimeMillis() - t0;

                // 4. Guardar métricas del bloque
                bloqueRes.setEnviosConRuta(solucion.enviosConRuta());
                bloqueRes.setEnviosSinRuta(enviosBloque.size() - solucion.enviosConRuta());
                bloqueRes.setPromedioSla(solucion.getPromedioConsumoSLA());
                bloqueRes.setOcupacionVuelos(solucion.getOcupacionVuelosPonderada());
                bloqueRes.setOcupacionAlmacenes(solucion.getOcupacionAlmacenesPonderada());
                bloqueRes.setDuracionMs(duracion);

                bloqueResultadoRepository.save(bloqueRes);

                // 5. Persistir rutas asignadas
                persistirAsignaciones(solucion, bloqueRes.getId());

                // 6. Actualizar estado de envíos en DB
                actualizarEstadoEnvios(solucion);

                log.info("Bloque {}/{} | Envíos: {} | SLA: {:.2f}% | {}ms",
                        bloqueActual, sim.getTotalBloquesEstimados(),
                        enviosBloque.size(), solucion.getPromedioConsumoSLA(), duracion);
            } else {
                bloqueRes.setDuracionMs(System.currentTimeMillis() - t0);
                bloqueResultadoRepository.save(bloqueRes);
                log.info("Bloque {}/{} — sin envíos", bloqueActual, sim.getTotalBloquesEstimados());
            }

            // 7. Avanzar cursor
            cursor = cursor.plusMinutes(sa);

            // 8. Actualizar estado en DB
            sim.setCursorTemporal(cursor);
            sim.setBloqueActual(bloqueActual);
            simulacionRepository.save(sim);

            // 9. Notificar frontend por WebSocket
            messagingTemplate.convertAndSend("/topic/simulacion/" + simulacionId, Map.of(
                    "simulacionId", simulacionId,
                    "bloqueActual", bloqueActual,
                    "totalBloques", sim.getTotalBloquesEstimados(),
                    "cursor", cursor.toString(),
                    "estado", sim.getEstado().name(),
                    "sla", bloqueRes.getPromedioSla(),
                    "ocupacionVuelos", bloqueRes.getOcupacionVuelos(),
                    "ocupacionAlmacenes", bloqueRes.getOcupacionAlmacenes(),
                    "envios", bloqueRes.getTotalEnvios(),
                    "duracionMs", bloqueRes.getDuracionMs()
            ));
        }

        // ═══════════════════════════════════════════════════
        // SIMULACIÓN FINALIZADA
        // ═══════════════════════════════════════════════════
        sim.setEstado(EstadoSimulacion.FINALIZADA);
        sim.setBloqueActual(bloqueActual);
        simulacionRepository.save(sim);
        pauseFlags.remove(simulacionId);

        messagingTemplate.convertAndSend("/topic/simulacion/" + simulacionId, Map.of(
                "simulacionId", simulacionId,
                "estado", "FINALIZADA",
                "bloqueActual", bloqueActual,
                "totalBloques", sim.getTotalBloquesEstimados()
        ));

        log.info("Simulación {} FINALIZADA. Total bloques: {}", simulacionId, bloqueActual);
    }

    // ========================================================
    // Persistir asignaciones de ruta en DB
    // ========================================================
    private void persistirAsignaciones(PlanificationSolutionOutput solucion, Long bloqueId) {
        List<AsignacionEnvioEntity> asignaciones = new ArrayList<>();

        for (EnvioAlgoritmo envio : solucion.getEnviosPlanificados()) {
            ResultadoRuta ruta = solucion.getRuta(envio);
            if (ruta == null || ruta.vuelosUsados.isEmpty()) continue;

            for (int i = 0; i < ruta.vuelosUsados.size(); i++) {
                VueloAlgoritmo vuelo = ruta.vuelosUsados.get(i);
                LocalDateTime fechaSalida = ruta.fechasVuelo.get(i);
                LocalDateTime fechaLlegada = fechaSalida.with(vuelo.getHoraLlegada());
                if (fechaLlegada.isBefore(fechaSalida)) {
                    fechaLlegada = fechaLlegada.plusDays(1);
                }

                AsignacionEnvioEntity asig = new AsignacionEnvioEntity();
                asig.setBloqueResultadoId(bloqueId);
                asig.setEnvioId(envio.getId());
                asig.setOrdenVuelo(i + 1);
                // Buscar el vuelo en DB por sus datos para obtener el ID
                asig.setVueloId(buscarVueloId(vuelo));
                asig.setFechaSalida(fechaSalida);
                asig.setFechaLlegada(fechaLlegada);
                asig.setEstado(AsignacionEnvioEntity.EstadoAsignacion.A_TIEMPO);

                asignaciones.add(asig);
            }
        }

        if (!asignaciones.isEmpty()) {
            asignacionEnvioRepository.saveAll(asignaciones);
        }
    }

    // ========================================================
    // Actualizar estado de envíos en la tabla envio
    // ========================================================
    private void actualizarEstadoEnvios(PlanificationSolutionOutput solucion) {
        List<EnvioEntity> updates = new ArrayList<>();

        for (EnvioAlgoritmo envioAlg : solucion.getEnviosPlanificados()) {
            ResultadoRuta ruta = solucion.getRuta(envioAlg);
            EnvioEntity entity = envioRepository.findById(envioAlg.getId()).orElse(null);
            if (entity == null) continue;

            if (ruta == null || ruta.vuelosUsados.isEmpty()) {
                entity.setEstado(EnvioEntity.EstadoEnvio.SIN_RUTA);
            } else {
                String destinoAlcanzado = ruta.vuelosUsados.get(ruta.vuelosUsados.size() - 1).getDestinoOaci();
                if (destinoAlcanzado.equals(envioAlg.getDestinoOaci())) {
                    entity.setEstado(EnvioEntity.EstadoEnvio.ENTREGADO);
                } else {
                    entity.setEstado(EnvioEntity.EstadoEnvio.EN_RUTA);
                }
            }
            updates.add(entity);
        }

        if (!updates.isEmpty()) {
            envioRepository.saveAll(updates);
        }
    }

    // ========================================================
    // Helper: buscar vuelo ID en DB
    // ========================================================
    private Long buscarVueloId(VueloAlgoritmo vuelo) {
        return vueloRepository.findByOrigenOaciAndDestinoOaciAndHoraSalidaAndHoraLlegada(
                vuelo.getOrigenOaci(), vuelo.getDestinoOaci(),
                vuelo.getHoraSalida(), vuelo.getHoraLlegada()
        ).map(v -> v.getId()).orElse(0L);
    }

    // ========================================================
    // CONSULTA: obtener estado de simulación
    // ========================================================
    public SimulacionEntity obtenerSimulacion(Long id) {
        return simulacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Simulación no encontrada"));
    }

    public List<BloqueResultadoEntity> obtenerBloques(Long simulacionId) {
        return bloqueResultadoRepository.findBySimulacionIdOrderByNumeroBloqueAsc(simulacionId);
    }

    public List<SimulacionEntity> listarSimulaciones() {
        return simulacionRepository.findAllByOrderByCreatedAtDesc();
    }

    // ========================================================
    // PRUEBA (mantener compatibilidad con endpoint existente)
    // ========================================================
    public PlanificationSolutionOutput procesarBloquePrueba(LocalDateTime inicioBloque, int ventanaScMinutos, int tiempoAlgoritmoTaSegundos) {
        log.info("Iniciando prueba de bloque desde {} por {} minutos", inicioBloque, ventanaScMinutos);

        List<AeropuertoAlgoritmo> aeropuertos = aeropuertoRepository.findAll().stream()
                .map(dataMapper::toAeropuertoAlgoritmo)
                .collect(Collectors.toList());

        List<VueloAlgoritmo> vuelos = vueloRepository.findAll().stream()
                .map(dataMapper::toVueloAlgoritmo)
                .collect(Collectors.toList());

        LocalDateTime finBloque = inicioBloque.plusMinutes(ventanaScMinutos);
        List<EnvioAlgoritmo> envios = envioRepository.findByFechaHoraRegistroBetweenOrderByFechaHoraRegistroAsc(inicioBloque, finBloque).stream()
                .map(dataMapper::toEnvioAlgoritmo)
                .collect(Collectors.toList());

        log.info("Datos cargados: {} aeropuertos, {} vuelos, {} envíos", aeropuertos.size(), vuelos.size(), envios.size());

        if (envios.isEmpty()) {
            log.warn("No hay envíos en este bloque de prueba.");
            return new PlanificationSolutionOutput("ACS");
        }

        PlanificationProblemInput input = new PlanificationProblemInput();
        aeropuertos.forEach(input::agregarAeropuerto);
        vuelos.forEach(input::agregarVuelo);
        envios.forEach(input::agregarEnvio);

        PlanificationProblemInput subInput = input.crearSubInput(envios);

        long tiempoMs = (long) tiempoAlgoritmoTaSegundos * 1000L;
        PlanificationSolutionOutput solucion = ACSAdapter.planificar(subInput, tiempoMs);

        log.info("Bloque planificado con éxito. SLA Promedio: {}", solucion.getPromedioConsumoSLA());

        return solucion;
    }
}
