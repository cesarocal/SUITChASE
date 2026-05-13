package com.tasf.b2b.repository;

import com.tasf.b2b.domain.EnvioEntity;
import com.tasf.b2b.domain.EnvioEntity.EstadoEnvio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnvioRepository extends JpaRepository<EnvioEntity, String> {

    // Para consumo por bloques en simulación
    List<EnvioEntity> findBySimulacionIdAndFechaHoraRegistroBetweenOrderByFechaHoraRegistroAsc(
            Long simulacionId, LocalDateTime inicio, LocalDateTime fin);

    // Para consumo en tiempo real (envíos sin simulación, pendientes)
    List<EnvioEntity> findBySimulacionIdIsNullAndEstadoAndFechaHoraRegistroBeforeOrderByFechaHoraRegistroAsc(
            EstadoEnvio estado, LocalDateTime antes);

    // Para la vista de aerolínea (sus propios envíos)
    List<EnvioEntity> findByAerolineaIdAndSimulacionIdIsNullOrderByFechaHoraRegistroDesc(Long aerolineaId);

    // Para la vista global (admin/operario)
    List<EnvioEntity> findBySimulacionIdIsNullOrderByFechaHoraRegistroDesc();

    // Para la vista de aerolínea filtrada por estado
    List<EnvioEntity> findByAerolineaIdAndEstadoAndSimulacionIdIsNullOrderByFechaHoraRegistroDesc(
            Long aerolineaId, EstadoEnvio estado);

    // Query original (mantener compatibilidad)
    List<EnvioEntity> findByFechaHoraRegistroBetweenOrderByFechaHoraRegistroAsc(
            LocalDateTime inicio, LocalDateTime fin);

    // Contar envíos por simulación (para estimar bloques)
    long countBySimulacionId(Long simulacionId);
}
