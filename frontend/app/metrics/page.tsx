"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { metricsApi, workoutApi, exerciseApi } from "@/lib/api";
import { MuscleHeatmap } from "@/components/MuscleHeatmap";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { clsx } from "clsx";

export default function MetricsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");

  const { data: metrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ["body-metrics"],
    queryFn: async () => {
      const r = await metricsApi.getAll();
      return r.data;
    },
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const r = await exerciseApi.getAll();
      return r.data;
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-metrics"],
    queryFn: async () => {
      const r = await workoutApi.getSessions({ limit: 10 });
      return r.data;
    },
  });

  // Memoize Fatigue Data calculation
  const fatigueData = useMemo(() => {
    const fatigue: Record<string, number> = {
      Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0
    };
    
    if (!sessions.length || !exercises.length) return fatigue;

    const now = new Date();
    sessions.forEach((s: any) => {
      const daysAgo = (now.getTime() - new Date(s.session_date).getTime()) / (1000 * 3600 * 24);
      if (daysAgo > 7) return;

      const intensity = Math.max(0, 100 - (daysAgo * 15));
      
      if (s.notes?.toLowerCase().includes("bench") || s.id % 4 === 0) fatigue.Chest = Math.max(fatigue.Chest, intensity);
      if (s.notes?.toLowerCase().includes("squat") || s.id % 4 === 1) fatigue.Legs = Math.max(fatigue.Legs, intensity);
      if (s.notes?.toLowerCase().includes("deadlift") || s.id % 4 === 2) fatigue.Back = Math.max(fatigue.Back, intensity);
      if (s.notes?.toLowerCase().includes("press") || s.id % 4 === 3) fatigue.Shoulders = Math.max(fatigue.Shoulders, intensity);
    });

    return fatigue;
  }, [sessions, exercises]);

  const createMutation = useMutation({
    mutationFn: () =>
      metricsApi.create({
        weight_kg: weight ? Number(weight) : undefined,
        goal: goal || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-metrics"] });
      setShowNew(false);
      setWeight("");
      setGoal("");
      setNotes("");
    },
  });

  // Memoize chart data
  const chartData = useMemo(() => {
    return [...metrics].reverse().map(m => ({
      date: new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: m.weight_kg,
    }));
  }, [metrics]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Biometric Data</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Analyzing physical evolution and recovery metrics.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 text-sm uppercase"
          >
            + Update Biometrics
          </button>
        </div>

        {/* Modal-style Form */}
        {showNew && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
              
              <h3 className="text-xl font-bold text-white mb-8 tracking-tight italic uppercase">Entry Protocol</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Current Weight (KG)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="75.0"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Current Directive</label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Hypertrophy, Cut, etc."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Sensor Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recovery state, mood, physical markers..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !weight}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all uppercase text-sm shadow-xl shadow-green-500/20"
                >
                  {createMutation.isPending ? "TRANSMITTING..." : "LOG BIOMETRICS"}
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="px-8 border border-white/10 text-gray-400 font-bold rounded-2xl hover:bg-white/5 transition-all text-sm uppercase"
                >
                  Abort
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Map */}
        <div className="mb-12">
          <MuscleHeatmap fatigueData={fatigueData} />
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Weight trajectory</h3>
              <div className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-1 rounded uppercase italic tracking-tighter">Live Sync</div>
            </div>
            
            {chartData.length > 1 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4B5563' }} dy={10} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4B5563' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #1F2937', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={4} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-700 text-[10px] font-black uppercase italic">Insufficient data points</div>
            )}
          </div>

          {/* History Column */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] ml-1">Combat Logs</h3>
            <div className="space-y-3">
              {metricsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
              ) : metrics.length === 0 ? (
                <div className="text-gray-700 text-[10px] font-black uppercase italic p-4 border border-dashed border-white/5 rounded-2xl">No sensor data</div>
              ) : (
                metrics.map((m: any) => (
                  <div key={m.id} className="bg-[#0A0A0A] border border-white/5 p-5 rounded-2xl transition-all hover:border-white/10 group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-bold text-white uppercase italic">
                        {new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-lg font-black text-green-500 italic tracking-tighter leading-none">{m.weight_kg}kg</div>
                    </div>
                    {m.goal && (
                      <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2">Target: {m.goal}</div>
                    )}
                    {m.notes && (
                      <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">{m.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
