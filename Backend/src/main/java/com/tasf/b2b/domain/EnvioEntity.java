package com.tasf.b2b.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "envio",
       indexes = {
           @Index(name = "idx_envio_simulacion_fecha", columnList = "simulacion_id, fecha_hora_registro"),
           @Index(name = "idx_envio_aerolinea_estado", columnList = "aerolinea_id, estado"),
           @Index(name = "idx_envio_estado_fecha", columnList = "estado, fecha_hora_registro")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnvioEntity {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "origen_oaci", nullable = false, length = 4)
    private String origenOaci;

    @Column(name = "destino_oaci", nullable = false, length = 4)
    private String destinoOaci;

    @Column(name = "fecha_hora_registro", nullable = false)
    private LocalDateTime fechaHoraRegistro;

    @Column(name = "cantidad_maletas", nullable = false)
    private Integer cantidadMaletas;

    @Column(name = "aerolinea_id", nullable = false)
    private Long aerolineaId;

    @Column(name = "operario_id")
    private Long operarioId;           // NULL si es sintético

    @Column(name = "es_sintetico", nullable = false)
    private Boolean esSintetico = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEnvio estado = EstadoEnvio.PENDIENTE;

    @Column(name = "simulacion_id")
    private Long simulacionId;          // NULL = tiempo real

    public enum EstadoEnvio {
        PENDIENTE, EN_RUTA, ENTREGADO, COLAPSO, SIN_RUTA
    }
}
