package com.tasf.b2b.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "envio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnvioEntity {
    // Para simplificar asumo que idEnvio es unico en BD o usamos un ID generado, 
    // pero el core usa ID string. Lo mapeamos directo.
    @Id
    private String id;
    
    private String origenOaci;
    private String destinoOaci;
    private LocalDateTime fechaHoraRegistro;
    private Integer cantidadMaletas;
    private String clienteId;
    private Boolean esSintetico;
}
