package com.tasf.b2b.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bloque_resultado",
       indexes = @Index(name = "idx_bloque_simulacion", columnList = "simulacion_id, numero_bloque"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BloqueResultadoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulacion_id", nullable = false)
    private Long simulacionId;

    @Column(name = "numero_bloque", nullable = false)
    private Integer numeroBloque;

    @Column(name = "inicio_ventana", nullable = false)
    private LocalDateTime inicioVentana;

    @Column(name = "fin_ventana", nullable = false)
    private LocalDateTime finVentana;

    @Column(name = "total_envios", nullable = false)
    private Integer totalEnvios = 0;

    @Column(name = "envios_con_ruta", nullable = false)
    private Integer enviosConRuta = 0;

    @Column(name = "envios_sin_ruta", nullable = false)
    private Integer enviosSinRuta = 0;

    @Column(name = "promedio_sla", nullable = false)
    private Double promedioSla = 0.0;

    @Column(name = "ocupacion_vuelos", nullable = false)
    private Double ocupacionVuelos = 0.0;

    @Column(name = "ocupacion_almacenes", nullable = false)
    private Double ocupacionAlmacenes = 0.0;

    @Column(name = "duracion_ms", nullable = false)
    private Long duracionMs = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
