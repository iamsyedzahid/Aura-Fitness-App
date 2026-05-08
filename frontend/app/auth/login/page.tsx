"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { api, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password too short").required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (values: any) => {
      const tokenRes = await authApi.login(values.email, values.password);
      const token = tokenRes.data.access_token;

      const userRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { token, user: userRes.data };
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push("/dashboard");
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    },
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: LoginSchema,
    onSubmit: (values) => {
      setServerError("");
      loginMutation.mutate(values);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-green-500 tracking-tighter mb-2">AuraFit</h1>
          <p className="text-gray-500 text-sm font-medium">Elevate your performance — Sign in to continue</p>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 shadow-2xl space-y-6"
        >
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl animate-shake">
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
            />

            <InputField
              label="Security Key"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password ? formik.errors.password : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-green-500/20"
          >
            {loginMutation.isPending ? "AUTHENTICATING..." : "SIGN IN"}
          </button>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-green-500 font-bold hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, name, type, placeholder, value, onChange, onBlur, error }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/5'} rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700`}
      />
      {error && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{error}</p>}
    </div>
  );
}