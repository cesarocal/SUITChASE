package com.tasf.b2b.core;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resultado de la planificaciÃ³n de ruta para un envÃ­o.
 */
public class ResultadoRuta {
    LocalDateTime           tiempoLlegadaFinal;
    List<VueloAlgoritmo>    vuelosUsados;
    List<LocalDateTime>     fechasVuelo;

    public ResultadoRuta(LocalDateTime tiempo,
                         List<VueloAlgoritmo> vuelos,
                         List<LocalDateTime> fechas) {
        this.tiempoLlegadaFinal   = tiempo;
        this.vuelosUsados         = vuelos;
        this.fechasVuelo          = fechas;
    }

}

