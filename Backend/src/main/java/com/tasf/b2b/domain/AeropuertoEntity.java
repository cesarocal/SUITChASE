package com.tasf.b2b.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "aeropuerto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AeropuertoEntity {
    @Id
    private String oaci;
    private String ciudad;
    private String pais;
    private String continente;
    private Integer gmt;
    private Integer capacidadAlmacen;
    private Double latitud;
    private Double longitud;
}
