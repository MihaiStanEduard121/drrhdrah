import React from "react";
import { AdminStats as StatsType } from "../types";
import { Layers, Activity, Tv, AlertCircle } from "lucide-react";

interface AdminStatsProps {
  stats: StatsType | null;
  loading: boolean;
}

export default function AdminStats({ stats, loading }: AdminStatsProps) {
  const cards = [
    {
      title: "Total Canale",
      value: loading ? "..." : stats?.total ?? 0,
      icon: <Tv className="h-5 w-5 text-indigo-400" />,
      bg: "from-indigo-500/10 to-transparent",
      border: "border-indigo-500/20",
      color: "text-indigo-400"
    },
    {
      title: "Canale Online",
      value: loading ? "..." : stats?.online ?? 0,
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      bg: "from-emerald-500/10 to-transparent",
      border: "border-emerald-500/20",
      color: "text-emerald-400"
    },
    {
      title: "Canale Offline",
      value: loading ? "..." : stats?.offline ?? 0,
      icon: <AlertCircle className="h-5 w-5 text-rose-400" />,
      bg: "from-rose-500/10 to-transparent",
      border: "border-rose-500/20",
      color: "text-rose-400"
    },
    {
      title: "Categorii Globale",
      value: loading ? "..." : stats?.categoriesCount ?? 0,
      icon: <Layers className="h-5 w-5 text-amber-400" />,
      bg: "from-amber-500/10 to-transparent",
      border: "border-amber-500/20",
      color: "text-amber-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-slate-900/40 border ${card.border} rounded-xl p-4.5 bg-gradient-to-br ${card.bg} backdrop-blur-md relative overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
              {card.title}
            </span>
            <div className={`p-2 rounded-lg bg-slate-950/60 border ${card.border}`}>
              {card.icon}
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-white tracking-tight">
            {card.value}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900">
            <div className={`h-full w-1/4 bg-current ${card.color}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
