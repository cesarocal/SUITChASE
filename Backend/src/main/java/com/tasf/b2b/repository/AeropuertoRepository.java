package com.tasf.b2b.repository;

import com.tasf.b2b.domain.AeropuertoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AeropuertoRepository extends JpaRepository<AeropuertoEntity, String> {
}
