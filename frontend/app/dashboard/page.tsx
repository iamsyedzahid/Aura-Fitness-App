"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { analyticsApi, workoutApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";
import { AuraVisual } from "@/components/AuraVisual";
import { CoachMessage } from "@/components/CoachMessage";
import { clsx } from "clsx";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const r = await analyticsApi.getSummary();
      return r.data;
    },
  });
  
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions-recent"],
    queryFn: async () => {
      const r = await workoutApi.getSessions({ limit: 5 });
      return r.data;
    },
  });
  
  const { data: volumeTrend } = useQuery({
    queryKey: ["volume-trend"],
    queryFn: async () => {
      const r = await analyticsApi.getVolumeTrend();
      return r.data;
    },
  });

  // Memoize greeting and date calculations
  const { greeting, formattedDate } = useMemo(() => {
    const hour = new Date().getHours();
    const g = hour < 12 ? "Rise and grind" : hour < 17 ? "Afternoon session" : "Evening recovery";
    const d = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    return { greeting: g, formattedDate: d };
  }, []);

  // Memoize Aura Score and Title calculations
  const { auraScore, auraTitle } = useMemo(() => {
    const score = Math.min(100, (summary?.total_sessions ?? 0) * 2 + (summary?.sessions_this_week ?? 0) * 10);
    let title = "Novice";
    if (score > 80) title = "Aesthetic God";
    else if (score > 50) title = "Iron Lifter";
    else if (score > 20) title = "Athlete";
    return { auraScore: score, auraTitle: title };
  }, [summary]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              {greeting}, {user?.full_name?.split(" ")[0] || "Athlete"}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">{formattedDate}</p>
              <div className="h-1 w-1 bg-gray-700 rounded-full" />
              <span className="text-green-500 text-xs font-black uppercase tracking-tighter">{auraTitle}</span>
            </div>
          </div>
          
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl flex items-center gap-6 shadow-2xl">
             <AuraVisual score={auraScore} />
             <div className="space-y-1">
               <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Live Aura</div>
               <div className="text-2xl font-black text-white italic uppercase tracking-tighter">{auraTitle}</div>
               <div className="text-[10px] text-gray-600 font-bold">{100 - auraScore} POINTS TO ASCEND</div>
             </div>
          </div>
        </div>

        {/* AI Coaching Insight */}
        <div className="mb-12">
          <CoachMessage summary={summary} sessions={sessions || []} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Sessions" value={summary?.total_sessions ?? "—"} color="text-green-500" />
          <StatCard label="Weekly Load" value={summary?.sessions_this_week ?? "—"} color="text-blue-500" />
          <StatCard label="Total Exercises" value={summary?.total_exercises ?? "—"} color="text-purple-500" />
          <StatCard label="Volume Moved" value={summary?.total_volume_kg ? Math.round(summary.total_volume_kg).toLocaleString() : "—"} suffix="KG" color="text-yellow-500" />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Chart */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Power Output</h3>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter italic">30 Day Trend</div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeTrend || []}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#4B5563' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#4B5563' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#1F2937', borderRadius: '12px' }}
                    itemStyle={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume_kg" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    fill="url(#volGrad)" 
                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#000' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Battles</h3>
              <Link href="/workouts" className="text-[10px] text-green-500 font-black uppercase hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {sessionsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)
              ) : sessions?.length ? (
                sessions.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-green-500/30 transition-all cursor-pointer">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white uppercase">{new Date(s.session_date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter truncate max-w-[200px]">{s.notes || "Standard Session"}</div>
                    </div>
                    <div className="bg-green-500/10 text-green-500 text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-tighter">
                      {s.log_count ?? 0} LOGS
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-600 text-xs font-bold uppercase italic">No Combat Records Found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color, suffix }: { label: string; value: any; color: string; suffix?: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-4 shadow-sm hover:border-white/10 transition-all">
      <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">{label}</div>
      <div className={clsx("text-4xl font-black italic tracking-tighter flex items-baseline gap-1", color)}>
        {value}
        {suffix && <span className="text-xs font-bold text-gray-600">{suffix}</span>}
      </div>
    </div>
  );
}
