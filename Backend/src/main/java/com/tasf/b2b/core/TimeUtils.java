package com.tasf.b2b.core;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class TimeUtils {
    public static final LocalDateTime FECHA_INICIO_SIM = LocalDateTime.of(2027, 7, 24, 0, 0);
    public static final LocalDateTime FECHA_FIN_SIM = LocalDateTime.of(2027, 7, 26, 0, 0);

    public static int getIndiceMinuto(LocalDateTime fecha) {
        int indice = (int) ChronoUnit.MINUTES.between(FECHA_INICIO_SIM, fecha);
        if (indice < 0) return 0;
        return indice;
    }
}
