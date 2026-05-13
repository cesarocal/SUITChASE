package com.tasf.b2b.service;

import com.tasf.b2b.domain.AeropuertoEntity;
import com.tasf.b2b.domain.EnvioEntity;
import com.tasf.b2b.repository.AeropuertoRepository;
import com.tasf.b2b.repository.EnvioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Genera envíos sintéticos para rangos de fechas sin cobertura en la base de datos.
 *
 * Los envíos generados se asocian a una simulacion_id y quedan listos para ser
 * consumidos por bloques durante la ejecución de la simulación.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatosSinteticosService {

    private final EnvioRepository envioRepository;
    private final AeropuertoRepository aeropuertoRepository;

    /**
     * Genera envíos sintéticos para el rango [fechaInicio, fechaFin)
     * con la densidad especificada.
     *
     * @param simulacionId   ID de la simulación a la que se asocian
     * @param fechaInicio    Inicio del rango temporal
     * @param fechaFin       Fin del rango temporal
     * @param enviosPorHora  Número promedio de envíos generados por hora
     * @param aerolineaId    Aerolínea por defecto para los envíos sintéticos
     * @return Número de envíos generados
     */
    public int generarEnviosSinteticos(Long simulacionId, LocalDateTime fechaInicio,
                                        LocalDateTime fechaFin, int enviosPorHora,
                                        Long aerolineaId) {

        List<AeropuertoEntity> aeropuertos = aeropuertoRepository.findAll();
        if (aeropuertos.isEmpty()) {
            throw new RuntimeException("No hay aeropuertos en la base de datos para generar envíos sintéticos");
        }

        long totalHoras = ChronoUnit.HOURS.between(fechaInicio, fechaFin);
        int totalEnvios = (int) (totalHoras * enviosPorHora);

        log.info("Generando {} envíos sintéticos para simulación {} ({} horas × {} envios/hora)",
                totalEnvios, simulacionId, totalHoras, enviosPorHora);

        Random rng = ThreadLocalRandom.current();
        List<EnvioEntity> batch = new ArrayList<>(500);
        int generados = 0;

        for (int i = 0; i < totalEnvios; i++) {
            // Fecha aleatoria dentro del rango
            long minutosRango = ChronoUnit.MINUTES.between(fechaInicio, fechaFin);
            long minutosAleatorios = rng.nextLong(minutosRango);
            LocalDateTime fechaRegistro = fechaInicio.plusMinutes(minutosAleatorios);

            // Aeropuertos origen y destino distintos
            AeropuertoEntity origen = aeropuertos.get(rng.nextInt(aeropuertos.size()));
            AeropuertoEntity destino;
            do {
                destino = aeropuertos.get(rng.nextInt(aeropuertos.size()));
            } while (destino.getOaci().equals(origen.getOaci()));

            // Crear envío sintético
            EnvioEntity envio = new EnvioEntity();
            envio.setId("SYN-" + simulacionId + "-" + String.format("%06d", i));
            envio.setOrigenOaci(origen.getOaci());
            envio.setDestinoOaci(destino.getOaci());
            envio.setFechaHoraRegistro(fechaRegistro);
            envio.setCantidadMaletas(1 + rng.nextInt(10)); // 1 a 10 maletas
            envio.setAerolineaId(aerolineaId);
            envio.setOperarioId(null);    // Sintético
            envio.setEsSintetico(true);
            envio.setEstado(EnvioEntity.EstadoEnvio.PENDIENTE);
            envio.setSimulacionId(simulacionId);

            batch.add(envio);

            // Persistir en batches de 500 para no saturar memoria
            if (batch.size() >= 500) {
                envioRepository.saveAll(batch);
                generados += batch.size();
                batch.clear();
            }
        }

        // Último batch
        if (!batch.isEmpty()) {
            envioRepository.saveAll(batch);
            generados += batch.size();
        }

        log.info("Generación completada: {} envíos sintéticos para simulación {}", generados, simulacionId);
        return generados;
    }
}
