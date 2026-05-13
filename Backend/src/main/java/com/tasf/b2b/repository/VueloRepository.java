package com.tasf.b2b.repository;

import com.tasf.b2b.domain.VueloEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VueloRepository extends JpaRepository<VueloEntity, Long> {
}
