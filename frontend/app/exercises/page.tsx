"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { exerciseApi } from "@/lib/api";
import { clsx } from "clsx";

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", search],
    queryFn: async () => {
      const r = await exerciseApi.getAll({ search: search || undefined });
      return r.data;
    },
  });

  // Memoize exercise list to prevent re-rendering during search input
  const exerciseList = useMemo(() => {
    return exercises.map((ex: any) => (
      <div
        key={ex.id}
        onClick={() => setSelectedExercise(ex)}
        className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex justify-between items-center cursor-pointer transition-all duration-300 hover:border-green-500/30 hover:bg-white/[0.02] shadow-sm group"
      >
        <div className="space-y-1">
          <div className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">
            {ex.name}
          </div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">
            {ex.muscle_group?.name || "Neural Target"} • {ex.equipment_type?.name || "Bare Metal"}
          </div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter italic">
          +{ex.aura_points || 10} AURA
        </div>
      </div>
    ));
  }, [exercises]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Neural Library</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Access combat protocols and form optimization data.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-green-500 transition-colors">
             🔍
          </div>
          <input
            type="text"
            placeholder="Search protocols (e.g. Squat, Bench)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-sm text-white outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700 shadow-2xl"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/5 border-dashed rounded-3xl p-20 text-center flex flex-col items-center gap-4">
            <span className="text-4xl grayscale opacity-20">📡</span>
            <p className="text-gray-600 text-sm font-bold uppercase italic tracking-widest">Protocol not found in local database</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exerciseList}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedExercise && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedExercise(null)}
        >
          <div 
            className="bg-[#0D0D0D] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Decoration */}
            <div className="h-1 bg-gradient-to-r from-green-500 to-purple-500 w-full" />
            
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedExercise.name}</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedExercise.muscle_group?.name} Protocol</p>
                </div>
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-1">
                  <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Aura Yield</div>
                  <div className="text-xl font-black text-purple-400 italic">+{selectedExercise.aura_points || 10}</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-1">
                  <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Effectiveness</div>
                  <div className="text-xl font-black text-green-400 italic uppercase">{selectedExercise.effectiveness || "Elite"}</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Execution Protocol</span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-sm text-gray-400 leading-relaxed italic max-h-[300px] overflow-auto">
                  {selectedExercise.description || "No specific instructions logged. Rely on muscle memory."}
                </div>
              </div>

              <button 
                onClick={() => setSelectedExercise(null)}
                className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-sm tracking-widest hover:bg-green-500 transition-colors shadow-lg shadow-white/5"
              >
                Close Link
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
