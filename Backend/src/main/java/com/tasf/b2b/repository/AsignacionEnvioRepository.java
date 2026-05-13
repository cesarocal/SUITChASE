package com.tasf.b2b.repository;

import com.tasf.b2b.domain.AsignacionEnvioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AsignacionEnvioRepository extends JpaRepository<AsignacionEnvioEntity, Long> {
    List<AsignacionEnvioEntity> findByEnvioIdOrderByOrdenVueloAsc(String envioId);
    List<AsignacionEnvioEntity> findByBloqueResultadoIdOrderByEnvioIdAscOrdenVueloAsc(Long bloqueResultadoId);
}
