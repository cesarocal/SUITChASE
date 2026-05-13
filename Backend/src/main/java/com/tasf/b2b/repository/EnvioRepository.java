package com.tasf.b2b.repository;

import com.tasf.b2b.domain.EnvioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnvioRepository extends JpaRepository<EnvioEntity, String> {
    List<EnvioEntity> findByFechaHoraRegistroBetweenOrderByFechaHoraRegistroAsc(LocalDateTime inicio, LocalDateTime fin);
}
