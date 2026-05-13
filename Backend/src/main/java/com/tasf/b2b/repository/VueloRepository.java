package com.tasf.b2b.repository;

import com.tasf.b2b.domain.VueloEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalTime;
import java.util.Optional;

@Repository
public interface VueloRepository extends JpaRepository<VueloEntity, Long> {
    Optional<VueloEntity> findByOrigenOaciAndDestinoOaciAndHoraSalidaAndHoraLlegada(
            String origenOaci, String destinoOaci, LocalTime horaSalida, LocalTime horaLlegada);
}
