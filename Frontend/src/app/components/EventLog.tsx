import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import type { SimEvent } from "../engine/types";
import { Package, Plane, MapPin, CheckCircle, XCircle, AlertTriangle, Cog } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  register: <Package className="w-3 h-3 text-blue-400 shrink-0" />,
  depart: <Plane className="w-3 h-3 text-cyan-400 shrink-0" />,
  arrive: <MapPin className="w-3 h-3 text-amber-400 shrink-0" />,
  deliver: <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />,
  cancel: <XCircle className="w-3 h-3 text-red-400 shrink-0" />,
  collapse: <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />,
  system: <Cog className="w-3 h-3 text-orange-400 shrink-0" />,
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
                {ICONS[e.type] || ICONS.register}
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