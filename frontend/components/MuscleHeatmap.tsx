"use client";
import React from "react";

interface MuscleHeatmapProps {
  fatigueData: Record<string, number>; // e.g. { "Chest": 80, "Legs": 20 }
}

export function MuscleHeatmap({ fatigueData }: MuscleHeatmapProps) {
  // Fatigue score: 0 (Recovered/Blue) to 100 (Fatigued/Red)
  const getMuscleColor = (muscle: string) => {
    const score = fatigueData[muscle] || 0;
    if (score > 70) return "#f87171"; // Red
    if (score > 40) return "#fbbf24"; // Amber
    if (score > 10) return "#22c55e"; // Green
    return "#3b82f6"; // Blue/Recovered
  };

  const muscles = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 20 }}>
        Muscle Fatigue Heatmap
      </div>
      
      <div style={{ display: "flex", gap: 32, justifyContent: "center", alignItems: "flex-end" }}>
        {muscles.map((m) => {
          const score = fatigueData[m] || 0;
          return (
            <div key={m} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ 
                width: 12, 
                height: 100, 
                background: "var(--bg-input)", 
                borderRadius: 6, 
                position: "relative",
                overflow: "hidden" 
              }}>
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  height: `${score}%`,
                  background: getMuscleColor(m),
                  borderRadius: 6,
                  transition: "height 1s ease-out",
                  boxShadow: `0 0 10px ${getMuscleColor(m)}44`,
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{m}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, fontSize: 12, color: "var(--text-secondary)" }}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Insight:</span> Your <span style={{ color: getMuscleColor("Legs") }}>Legs</span> are fully recovered. Perfect day for a heavy squat session!
      </div>
    </div>
  );
}
