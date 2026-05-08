"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { workoutApi, exerciseApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function WorkoutSessionDetail() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);
  const qc = useQueryClient();

  const [showAddLog, setShowAddLog] = useState(false);
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => workoutApi.getSession(sessionId).then((r) => r.data),
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseApi.getAll().then((r) => r.data),
  });

  const logMutation = useMutation({
    mutationFn: () =>
      workoutApi.logPerformance(sessionId, {
        exercise_id: Number(exerciseId),
        sets: Number(sets),
        reps: Number(reps),
        weight_kg: Number(weight),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
      setShowAddLog(false);
      setExerciseId("");
      setSets("");
      setReps("");
      setWeight("");
      setNotes("");
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: 60 }}>Loading session…</div>
      </AppShell>
    );
  }

  if (isError || !session) {
    return (
      <AppShell>
        <div style={{ color: "var(--red)", fontSize: 14, textAlign: "center", padding: 60 }}>
          Session not found or an error occurred.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.push("/workouts")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ‹ Back to workouts
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
                Workout on {new Date(session.session_date).toLocaleDateString()}
              </h1>
              {session.notes && (
                <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: "8px 0 0" }}>
                  {session.notes}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAddLog(true)}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "none",
                background: "var(--green-500)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Exercise Log
            </button>
          </div>
        </div>

        {/* Add Log Form */}
        {showAddLog && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>Log Exercise</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Exercise</label>
                <select
                  value={exerciseId}
                  onChange={(e) => setExerciseId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="">Select an exercise…</option>
                  {exercises?.map((ex: any) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 60"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Sets</label>
                <input
                  type="number"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="e.g. 3"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Reps (per set)</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="e.g. 10"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Felt easy, form was good…"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => logMutation.mutate()}
                disabled={logMutation.isPending || !exerciseId || !sets || !reps || !weight}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--green-500)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: (!exerciseId || !sets || !reps || !weight) ? 0.5 : 1,
                }}
              >
                {logMutation.isPending ? "Saving…" : "Save Log"}
              </button>
              <button
                onClick={() => setShowAddLog(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Logs List */}
        {session.logs?.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No exercises logged yet.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {session.logs?.map((log: any) => {
              const exName = exercises?.find((e: any) => e.id === log.exercise_id)?.name || "Unknown Exercise";
              return (
                <div key={log.id} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15, color: "var(--text-primary)" }}>
                        {exName}
                      </div>
                      {log.notes && (
                        <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                          {log.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                        {log.weight_kg} kg
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        {log.sets} sets × {log.reps} reps
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
