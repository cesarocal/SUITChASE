package com.tasf.b2b.core;

import java.util.Map;

public class FeromonaManager {

    /**
     * FUNCIÃ“N ConservarFeromonas(Ï„_anterior, Ï„0_anterior, Ï„0_nuevo)
     * ConservaciÃ³n entre reoptimizaciones (ante cancelaciÃ³n de vuelo o eventos dinÃ¡micos):
     */
    public static void ConservarFeromonas(Map<String, Double> feromonas, double tau0Anterior, double tau0Nuevo, double gamma) {
        
        // PARA CADA par (i,j) presentes en nuevo problema HACER
        // Iteramos directamente sobre las claves almacenadas en nuestra matriz dispersa.
        for (Map.Entry<String, Double> entry : feromonas.entrySet()) {
            
            // Ï„_ij_anterior
            double tau_ij_anterior = entry.getValue();
            
            // Ï„ij â† (1âˆ’Î³) * Ï„ij_anterior * (Ï„0_nuevo/Ï„0_anterior) + Î³ * Ï„0_nuevo
            double factorActualizacion = tau0Nuevo / tau0Anterior;
            double nuevoTau = (1 - gamma) * tau_ij_anterior * factorActualizacion + gamma * tau0Nuevo;
            
            // Actualizamos en el mapa
            feromonas.put(entry.getKey(), nuevoTau);
        }
    }
}

