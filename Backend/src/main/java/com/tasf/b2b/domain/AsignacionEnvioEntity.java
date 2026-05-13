package com.tasf.b2b.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "asignacion_envio",
       indexes = {
           @Index(name = "idx_asignacion_envio", columnList = "envio_id"),
           @Index(name = "idx_asignacion_bloque", columnList = "bloque_resultado_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionEnvioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bloque_resultado_id")
    private Long bloqueResultadoId;   // NULL si es tiempo real

    @Column(name = "envio_id", nullable = false, length = 50)
    private String envioId;

    @Column(name = "orden_vuelo", nullable = false)
    private Integer ordenVuelo;

    @Column(name = "vuelo_id", nullable = false)
    private Long vueloId;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDateTime fechaSalida;

    @Column(name = "fecha_llegada", nullable = false)
    private LocalDateTime fechaLlegada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAsignacion estado = EstadoAsignacion.A_TIEMPO;

    public enum EstadoAsignacion {
        A_TIEMPO, COLAPSO, SIN_RUTA
    }
}
