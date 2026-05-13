package com.tasf.b2b.core;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Utilidades de tiempo para el sistema de simulación.
 *
 * Las fechas de inicio/fin son configurables por simulación para permitir
 * que cada simulación tenga su propio rango temporal sin afectar a otras.
 */
public class TimeUtils {

    // Valores por defecto (se sobrescriben al iniciar cada simulación)
    public static volatile LocalDateTime FECHA_INICIO_SIM = LocalDateTime.of(2027, 7, 24, 0, 0);
    public static volatile LocalDateTime FECHA_FIN_SIM = LocalDateTime.of(2027, 7, 26, 0, 0);

    public static void setFechaInicioSim(LocalDateTime fecha) {
        FECHA_INICIO_SIM = fecha;
    }

    public static void setFechaFinSim(LocalDateTime fecha) {
        FECHA_FIN_SIM = fecha;
    }

    public static LocalDateTime getFechaInicioSim() {
        return FECHA_INICIO_SIM;
    }

    public static LocalDateTime getFechaFinSim() {
        return FECHA_FIN_SIM;
    }

    public static int getIndiceMinuto(LocalDateTime fecha) {
        int indice = (int) ChronoUnit.MINUTES.between(FECHA_INICIO_SIM, fecha);
        if (indice < 0) return 0;
        return indice;
    }
}
