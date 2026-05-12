import React from "react";
import { useSim } from "../context/SimContext";
import { useTheme } from "../context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { AIRPORTS } from "../data/airports";

export function StatsCharts() {
  const { state } = useSim();
  const { isDark } = useTheme();

  const deliveryData = state.stats.deliveredHistory.filter((_, i) => i % 5 === 0).slice(-60).map((d, idx) => ({
    time: `D${Math.floor(d.time / 24 + 1)}`,
    entregadas: d.count,
    _key: idx,
  }));

  const continentData = (["America", "Europa", "Asia"] as const).map(cont => {
    const airports = AIRPORTS.filter(a => a.continent === cont);
    let stock = 0, cap = 0;
    for (const a of airports) {
      const s = state.airports[a.code];
      if (s) { stock += s.currentStock; cap += s.capacity; }
    }
    return { name: cont, utilización: cap > 0 ? Math.round((stock / cap) * 100) : 0 };
  });

  const topAirports = Object.values(state.airports)
    .sort((a, b) => b.currentStock - a.currentStock)
    .slice(0, 8)
    .map(a => ({ code: a.code, maletas: a.currentStock, capacidad: a.capacity }));

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#22c55e"];

  const cardCls = isDark ? "bg-[#1e293b]/50 border-[#334155]" : "bg-white border-[#cbd5e1]";
  const titleCls = isDark ? "text-white" : "text-[#0f172a]";
  const gridStroke = isDark ? "#334155" : "#c8d0d8";
  const axisStroke = isDark ? "#64748b" : "#6b7280";
  const tooltipStyle = isDark
    ? { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }
    : { background: "#f3f4f6", border: "1px solid #c8d0d8", borderRadius: 8, fontSize: 12, color: "#111827" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className={cardCls}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-[14px] ${titleCls}`}>Entregas Acumuladas</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryData}>
              <CartesianGrid stroke={gridStroke} />
              <XAxis dataKey="time" stroke={axisStroke} tick={{ fontSize: 10, fill: axisStroke }} allowDuplicatedCategory={true} />
              <YAxis stroke={axisStroke} tick={{ fontSize: 10, fill: axisStroke }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="entregadas" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className={cardCls}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-[14px] ${titleCls}`}>Almacén por Continente</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={continentData}>
              <CartesianGrid stroke={gridStroke} />
              <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 10, fill: axisStroke }} />
              <YAxis stroke={axisStroke} tick={{ fontSize: 10, fill: axisStroke }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="utilización" radius={[4, 4, 0, 0]}>
                {continentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className={`${cardCls} md:col-span-2`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-[14px] ${titleCls}`}>Top Aeropuertos por Carga</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAirports} layout="vertical">
              <CartesianGrid stroke={gridStroke} />
              <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 10, fill: axisStroke }} />
              <YAxis dataKey="code" type="category" stroke={axisStroke} width={40} tick={{ fontSize: 10, fill: axisStroke }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="maletas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="capacidad" fill={isDark ? "#334155" : "#a0aec0"} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}