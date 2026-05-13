package com.tasf.b2b.api;

import com.tasf.b2b.domain.AeropuertoEntity;
import com.tasf.b2b.repository.AeropuertoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aeropuertos")
@RequiredArgsConstructor
public class AeropuertoController {

    private final AeropuertoRepository aeropuertoRepository;

    @GetMapping
    public List<AeropuertoEntity> getAll() {
        return aeropuertoRepository.findAll();
    }

    @GetMapping("/{oaci}")
    public ResponseEntity<AeropuertoEntity> getByOaci(@PathVariable String oaci) {
        return aeropuertoRepository.findById(oaci)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public AeropuertoEntity create(@RequestBody AeropuertoEntity aeropuerto) {
        return aeropuertoRepository.save(aeropuerto);
    }

    @PutMapping("/{oaci}")
    public ResponseEntity<AeropuertoEntity> update(@PathVariable String oaci, @RequestBody AeropuertoEntity details) {
        return aeropuertoRepository.findById(oaci).map(aeropuerto -> {
            aeropuerto.setCiudad(details.getCiudad());
            aeropuerto.setPais(details.getPais());
            aeropuerto.setContinente(details.getContinente());
            aeropuerto.setGmt(details.getGmt());
            aeropuerto.setCapacidadAlmacen(details.getCapacidadAlmacen());
            aeropuerto.setLatitud(details.getLatitud());
            aeropuerto.setLongitud(details.getLongitud());
            return ResponseEntity.ok(aeropuertoRepository.save(aeropuerto));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{oaci}")
    public ResponseEntity<Void> delete(@PathVariable String oaci) {
        if (aeropuertoRepository.existsById(oaci)) {
            aeropuertoRepository.deleteById(oaci);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
