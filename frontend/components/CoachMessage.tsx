"use client";
import React, { memo, useMemo } from "react";

interface CoachMessageProps {
  summary: any;
  sessions: any[];
}

export const CoachMessage = memo(function CoachMessage({ summary, sessions }: CoachMessageProps) {
  const message = useMemo(() => {
    if (!summary || !sessions?.length) return "Protocol initiated. Log your first combat session to receive neural optimization feedback.";

    const weeklySessions = summary.sessions_this_week || 0;
    const totalVolume = summary.total_volume_kg || 0;

    if (weeklySessions >= 4) {
      return `SYNERGY DETECTED: ${weeklySessions} sessions this week. Your output is exceptional. Recommendation: Focus on explosive eccentric phases for your next compound lifts to break your current plateau.`;
    }

    if (totalVolume > 5000) {
      return `VOLUME MILESTONE: ${Math.round(totalVolume)}kg total load achieved. Your structural integrity is increasing. Priority: Increase hydration and sleep by 15% to support accelerated fiber repair.`;
    }

    return "Neural synchronization in progress. Maintain your current training frequency to stabilize your strength baseline.";
  }, [summary, sessions]);

  return (
    <div className="group relative bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden transition-all hover:border-green-500/20">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none" />
      
      <div className="relative flex items-start gap-5">
        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 shadow-inner group-hover:bg-green-500/20 transition-all duration-500">
          <span className="text-2xl animate-pulse">🤖</span>
        </div>
        
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-green-500 font-black uppercase tracking-[0.25em]">Aura AI Protocol</div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-green-500/20 to-transparent" />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed font-medium italic">
            &ldquo;{message}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
});
