package com.tasf.b2b.api;

import com.tasf.b2b.core.PlanificationSolutionOutput;
import com.tasf.b2b.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/simulacion")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    @GetMapping("/test-bloque")
    public ResponseEntity<PlanificationSolutionOutput> testBloque(
            @RequestParam(defaultValue = "2027-07-24T00:00:00") String inicio,
            @RequestParam(defaultValue = "120") int ventanaSc,
            @RequestParam(defaultValue = "15") int taSegundos) {

        LocalDateTime inicioBloque = LocalDateTime.parse(inicio, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        PlanificationSolutionOutput resultado = simulationService.procesarBloquePrueba(inicioBloque, ventanaSc, taSegundos);
        
        return ResponseEntity.ok(resultado);
    }
}
