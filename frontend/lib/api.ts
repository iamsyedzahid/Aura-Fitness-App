import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(err);
  }
);

/* ─── Auth ─────────────────────────────────────────────────────────── */
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/token", new URLSearchParams({ username: email, password }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

/* ─── Workouts ──────────────────────────────────────────────────────── */
export const workoutApi = {
  getSessions: (params?: { skip?: number; limit?: number }) =>
    api.get("/workouts/sessions", { params }),
  createSession: (data: { notes?: string; session_date?: string }) =>
    api.post("/workouts/sessions", data),
  getSession: (id: number) => api.get(`/workouts/sessions/${id}`),
  logPerformance: (sessionId: number, data: {
    exercise_id: number;
    sets: number;
    reps: number;
    weight_kg: number;
    notes?: string;
  }) => api.post(`/workouts/sessions/${sessionId}/logs`, data),
};

/* ─── Exercises ─────────────────────────────────────────────────────── */
export const exerciseApi = {
  getAll: (params?: { search?: string; muscle_group_id?: number }) =>
    api.get("/exercises", { params }),
  getMuscleGroups: () => api.get("/exercises/muscle-groups"),
  getEquipmentTypes: () => api.get("/exercises/equipment-types"),
};

/* ─── Body Metrics ──────────────────────────────────────────────────── */
export const metricsApi = {
  getAll: () => api.get("/metrics/body"),
  create: (data: { weight_kg?: number; goal?: string; notes?: string }) =>
    api.post("/metrics/body", data),
};

/* ─── Analytics ─────────────────────────────────────────────────────── */
export const analyticsApi = {
  getVolumeTrend: () => api.get("/analytics/volume-trend"),
  getStrengthProgress: (exerciseId: number) =>
    api.get(`/analytics/strength-progress/${exerciseId}`),
  getSummary: () => api.get("/analytics/summary"),
};
/* ─── AI Coaching ───────────────────────────────────────────────────────────── */
export const aiApi = {
  chat: (message: string, history: any[] = [], session_id?: number) =>
    api.post("/ai/chat", { message, history, session_id }),
  history: (session_id?: number) => api.get("/ai/history", { params: { session_id } }),
  sessions: () => api.get("/ai/sessions"),
};
