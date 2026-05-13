package com.tasf.b2b.api;

import com.tasf.b2b.domain.AsignacionEnvioEntity;
import com.tasf.b2b.domain.EnvioEntity;
import com.tasf.b2b.repository.AsignacionEnvioRepository;
import com.tasf.b2b.repository.EnvioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/envios")
@RequiredArgsConstructor
public class EnvioController {

    private final EnvioRepository envioRepository;
    private final AsignacionEnvioRepository asignacionEnvioRepository;

    // ========================================
    // REGISTRAR ENVÍO — OPERARIO / ADMIN
    // ========================================
    @PostMapping
    public ResponseEntity<?> registrarEnvio(@RequestBody RegistroEnvioRequest request,
                                            Authentication auth) {
        EnvioEntity envio = new EnvioEntity();
        envio.setId("ENV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        envio.setOrigenOaci(request.origenOaci());
        envio.setDestinoOaci(request.destinoOaci());
        envio.setCantidadMaletas(request.cantidadMaletas());
        envio.setAerolineaId(request.aerolineaId());
        envio.setFechaHoraRegistro(LocalDateTime.now());
        envio.setEsSintetico(false);
        envio.setEstado(EnvioEntity.EstadoEnvio.PENDIENTE);
        envio.setSimulacionId(null); // Tiempo real

        // Obtener el ID del operario desde el token (si está disponible)
        // Por ahora usamos null, se puede mejorar con un UserService
        envio.setOperarioId(null);

        envioRepository.save(envio);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", envio.getId(),
                        "mensaje", "Envío registrado exitosamente",
                        "estado", envio.getEstado().name()
                ));
    }

    // ========================================
    // MIS ENVÍOS — AEROLÍNEA
    // ========================================
    @GetMapping("/mis-envios")
    public ResponseEntity<List<EnvioEntity>> misEnvios(Authentication auth) {
        // El aerolineaId está almacenado en credentials del token
        Long aerolineaId = (Long) auth.getCredentials();
        if (aerolineaId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<EnvioEntity> envios = envioRepository
                .findByAerolineaIdAndSimulacionIdIsNullOrderByFechaHoraRegistroDesc(aerolineaId);

        return ResponseEntity.ok(envios);
    }

    // ========================================
    // VER RUTA DE UN ENVÍO — Cualquier autenticado
    // ========================================
    @GetMapping("/{id}/ruta")
    public ResponseEntity<?> verRuta(@PathVariable String id, Authentication auth) {
        var envio = envioRepository.findById(id);
        if (envio.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Si es AEROLINEA, verificar que el envío le pertenece
        Long aerolineaId = (Long) auth.getCredentials();
        if (aerolineaId != null && !envio.get().getAerolineaId().equals(aerolineaId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "No tiene permiso para ver este envío"));
        }

        List<AsignacionEnvioEntity> tramos = asignacionEnvioRepository
                .findByEnvioIdOrderByOrdenVueloAsc(id);

        return ResponseEntity.ok(Map.of(
                "envio", envio.get(),
                "ruta", tramos
        ));
    }

    // --- DTO ---
    public record RegistroEnvioRequest(String origenOaci, String destinoOaci,
                                       Integer cantidadMaletas, Long aerolineaId) {}
}
