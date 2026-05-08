"use client";
import React, { memo } from "react";

interface AuraVisualProps {
  score: number; // 0-100
}

export const AuraVisual = memo(function AuraVisual({ score }: AuraVisualProps) {
  // Determine color based on score (Aura intensity)
  const getAuraColor = (s: number) => {
    if (s > 80) return "rgba(34, 197, 94, 0.8)"; // Radiant Green
    if (s > 50) return "rgba(168, 85, 247, 0.8)"; // Power Purple
    if (s > 20) return "rgba(59, 130, 246, 0.8)"; // Kinetic Blue
    return "rgba(156, 163, 175, 0.4)";            // Muted Gray
  };

  const auraColor = getAuraColor(score);
  // Adjusted sizing for better layout integration
  const size = 100 + (score * 0.4); 

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }}>
      {/* Outer Pulse */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
        filter: "blur(15px)",
        animation: "aura-pulse 4s infinite ease-in-out",
      }} />

      {/* Inner Glow */}
      <div style={{
        position: "absolute",
        width: "50%",
        height: "50%",
        borderRadius: "50%",
        background: auraColor,
        filter: "blur(8px)",
        boxShadow: `0 0 30px ${auraColor}`,
        animation: "aura-inner 2s infinite alternate",
      }} />

      {/* Core */}
      <div style={{
        position: "relative",
        zIndex: 2,
        color: "white",
        textAlign: "center",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontSize: "20px", fontWeight: "900", fontStyle: "italic", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: "8px", fontWeight: "800", opacity: 0.8, textTransform: "uppercase", letterSpacing: "2px", marginTop: 2 }}>AURA</div>
      </div>

      <style jsx>{`
        @keyframes aura-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes aura-inner {
          from { transform: scale(0.85); opacity: 0.6; }
          to { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
