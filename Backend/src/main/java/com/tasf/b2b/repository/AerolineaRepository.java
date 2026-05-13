package com.tasf.b2b.repository;

import com.tasf.b2b.domain.AerolineaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AerolineaRepository extends JpaRepository<AerolineaEntity, Long> {
    Optional<AerolineaEntity> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
