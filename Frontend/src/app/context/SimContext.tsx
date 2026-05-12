import React, { createContext, useContext } from "react";
import { useSimulation } from "../engine/useSimulation";

type SimContextType = ReturnType<typeof useSimulation>;

const SimContext = createContext<SimContextType | null>(null);

export function SimProvider({ children }: { children: React.ReactNode }) {
  const sim = useSimulation();
  return <SimContext.Provider value={sim}>{children}</SimContext.Provider>;
}

export function useSim(): SimContextType {
  const ctx = useContext(SimContext);
  if (!ctx) {
    throw new Error("useSim must be used within SimProvider");
  }
  return ctx;
}