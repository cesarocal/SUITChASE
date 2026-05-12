import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import type { SimEvent } from "../engine/types";
import { Package, Plane, MapPin, CheckCircle, XCircle, AlertTriangle, Cog } from "lucide-react";

const ICONS: Record<string, (isDark: boolean) => React.ReactNode> = {
  register: (isDark) => <Package className={`w-3 h-3 shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`} />,
  depart: (isDark) => <Plane className={`w-3 h-3 shrink-0 ${isDark ? "text-cyan-400" : "text-blue-700"}`} />,
  arrive: (isDark) => <MapPin className={`w-3 h-3 shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />,
  deliver: (isDark) => <CheckCircle className={`w-3 h-3 shrink-0 ${isDark ? "text-green-400" : "text-green-600"}`} />,
  cancel: (isDark) => <XCircle className={`w-3 h-3 shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />,
  collapse: (isDark) => <AlertTriangle className={`w-3 h-3 shrink-0 ${isDark ? "text-red-500" : "text-red-700"}`} />,
  system: (isDark) => <Cog className={`w-3 h-3 shrink-0 ${isDark ? "text-orange-400" : "text-orange-600"}`} />,
};

export function EventLog({ events }: { events: SimEvent[] }) {
  const { isDark } = useTheme();
  const recent = events.slice(-100);

  const cardCls = isDark ? "bg-[#1e293b]/50 border-[#334155]" : "bg-white border-[#cbd5e1]";
  const titleCls = isDark ? "text-white" : "text-[#0f172a]";
  const dividerCls = isDark ? "border-[#1e293b]" : "border-[#e2e8f0]";
  const timeCls = isDark ? "text-white/50" : "text-[#6b7280]";
  const textCls = isDark ? "text-white" : "text-[#111827]";

  return (
    <Card className={cardCls}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-[14px] ${titleCls}`}>Registro de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[430px]">
          <div className="space-y-1 pr-3">
            {recent.map((e, i) => (
              <div key={i} className={`flex items-start gap-2 py-1 border-b ${dividerCls}`}>
                {ICONS[e.type] ? ICONS[e.type](isDark) : ICONS.register(isDark)}
                <div className="min-w-0">
                  <span className={`text-[10px] mr-2 ${timeCls}`}>
                    D{Math.floor(e.time / 24 + 1)} {String(Math.floor(e.time % 24)).padStart(2, "0")}:{String(Math.round((e.time % 1) * 60)).padStart(2, "0")}
                  </span>
                  <span className={`text-[11px] ${textCls}`}>{e.description}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}