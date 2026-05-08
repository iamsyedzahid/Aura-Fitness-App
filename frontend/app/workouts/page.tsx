"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { workoutApi } from "@/lib/api";
import { clsx } from "clsx";

export default function WorkoutsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const r = await workoutApi.getSessions({ limit: 50 });
      return r.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      workoutApi.createSession({
        notes: notes || undefined,
        session_date: new Date(sessionDate).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setShowNew(false);
      setNotes("");
    },
  });

  // Memoize session list to prevent re-rendering when other states change
  const renderedSessions = useMemo(() => {
    return sessions.map((s: any) => (
      <Link key={s.id} href={`/workouts/${s.id}`} className="block group">
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex justify-between items-center transition-all duration-300 hover:border-green-500/30 hover:bg-white/[0.02] shadow-sm">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">
              {new Date(s.session_date).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </div>
            {s.notes && (
              <p className="text-xs text-gray-500 line-clamp-1 italic">{s.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
              {s.log_count ?? 0} EXERCISES
            </div>
            <span className="text-gray-700 group-hover:text-green-500 transition-colors text-xl">›</span>
          </div>
        </div>
      </Link>
    ));
  }, [sessions]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Training Log</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              You have completed <span className="text-green-500 font-bold">{sessions.length}</span> battle sessions.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 text-sm uppercase"
          >
            + Start Session
          </button>
        </div>

        {/* Modal-style Form Overlay */}
        {showNew && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
              
              <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Session Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Focus points, feelings, goals..."
                    rows={1}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all uppercase text-sm shadow-xl shadow-green-500/20"
                >
                  {createMutation.isPending ? "INITIALIZING..." : "INITIATE SESSION"}
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

        {/* Sessions Content */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-[#0A0A0A] border border-white/5 border-dashed rounded-3xl p-20 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-green-500/5 rounded-full flex items-center justify-center border border-green-500/10">
              <span className="text-4xl">🏋️</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">The floor is waiting.</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">Your journey starts with the first set. Log your session to begin tracking progress.</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="text-green-400 font-bold hover:text-green-300 underline underline-offset-8 transition-all uppercase text-xs tracking-widest"
            >
              Start Your First Workout
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {renderedSessions}
          </div>
        )}
      </div>
    </AppShell>
  );
}
