"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { analyticsApi, exerciseApi } from "@/lib/api";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function AnalyticsPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analyticsApi.getSummary().then((r) => r.data),
  });

  const { data: volumeTrend, isLoading: isVolumeLoading } = useQuery({
    queryKey: ["volume-trend"],
    queryFn: () => analyticsApi.getVolumeTrend().then((r) => r.data),
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseApi.getAll().then((r) => r.data),
  });

  const { data: strengthProgress, isLoading: isStrengthLoading } = useQuery({
    queryKey: ["strength-progress", selectedExerciseId],
    queryFn: () => analyticsApi.getStrengthProgress(Number(selectedExerciseId)).then((r) => r.data),
    enabled: !!selectedExerciseId,
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", margin: 0, marginBottom: 4 }}>
            Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
            Deep dive into your workout performance and progress.
          </p>
        </div>

        {/* Summary Cards */}
        {isSummaryLoading ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>Loading summary…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Sessions</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--green-400)" }}>{summary?.total_sessions ?? 0}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>This Week</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--blue-400)" }}>{summary?.sessions_this_week ?? 0}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Exercises</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--purple-400)" }}>{summary?.total_exercises ?? 0}</div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Volume (kg)</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--amber)" }}>
                {summary?.total_volume_kg ? Math.round(summary.total_volume_kg).toLocaleString() : 0}
              </div>
            </div>
          </div>
        )}

        {/* Volume Trend Chart */}
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Volume Trend (Last 30 Days)</div>
          {isVolumeLoading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading chart…</div>
          ) : volumeTrend?.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>No volume data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={volumeTrend}>
                <defs>
                  <linearGradient id="volGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="volume_kg" name="Volume (kg)" stroke="#4ade80" fill="url(#volGradAnalytics)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Strength Progress Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Strength Progress</div>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                minWidth: 200,
              }}
            >
              <option value="">Select an exercise…</option>
              {exercises?.map((ex: any) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {!selectedExerciseId ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, height: 250, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 8 }}>
              Select an exercise to view your 1RM progression.
            </div>
          ) : isStrengthLoading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading progress…</div>
          ) : strengthProgress?.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14, height: 250, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 8 }}>
              No data logged for this exercise yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={strengthProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="estimated_1rm" name="Estimated 1RM (kg)" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: "#c084fc" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AppShell>
  );
}
