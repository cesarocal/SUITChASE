package com.tasf.b2b.repository;

import com.tasf.b2b.domain.BloqueResultadoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloqueResultadoRepository extends JpaRepository<BloqueResultadoEntity, Long> {
    List<BloqueResultadoEntity> findBySimulacionIdOrderByNumeroBloqueAsc(Long simulacionId);
}
