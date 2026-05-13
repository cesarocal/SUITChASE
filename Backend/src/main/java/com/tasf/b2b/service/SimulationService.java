package com.tasf.b2b.service;

import com.tasf.b2b.core.*;
import com.tasf.b2b.repository.AeropuertoRepository;
import com.tasf.b2b.repository.EnvioRepository;
import com.tasf.b2b.repository.VueloRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final AeropuertoRepository aeropuertoRepository;
    private final VueloRepository vueloRepository;
    private final EnvioRepository envioRepository;
    private final DataMapperService dataMapper;

    public PlanificationSolutionOutput procesarBloquePrueba(LocalDateTime inicioBloque, int ventanaScMinutos, int tiempoAlgoritmoTaSegundos) {
        log.info("Iniciando prueba de bloque desde {} por {} minutos", inicioBloque, ventanaScMinutos);

        // 1. Obtener datos de la BD
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

        // 2. Construir Input
        PlanificationProblemInput input = new PlanificationProblemInput();
        aeropuertos.forEach(input::agregarAeropuerto);
        vuelos.forEach(input::agregarVuelo);
        envios.forEach(input::agregarEnvio); // Importante: agregarEnvio los añade al subInput correctamente.
        
        // Creamos un subinput directamente para este bloque usando la lógica original
        PlanificationProblemInput subInput = input.crearSubInput(envios);

        // 3. Ejecutar algoritmo ACS
        long tiempoMs = (long) tiempoAlgoritmoTaSegundos * 1000L;
        PlanificationSolutionOutput solucion = ACSAdapter.planificar(subInput, tiempoMs);

        log.info("Bloque planificado con éxito. SLA Promedio: {}", solucion.getPromedioConsumoSLA());

        // 4. Retornar JSON
        return solucion;
    }
}
