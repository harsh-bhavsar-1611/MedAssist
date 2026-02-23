import React, { useState } from "react";
import { HeartPulse, Lock, ShieldAlert } from "lucide-react";
import { ApiError, apiFetch } from "../lib/api";

const AdminAuthPage = ({ onAuthenticated, onBackToLanding }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/api/auth/login/", {
        method: "POST",
        body: { email: form.email, password: form.password },
      });
      const authenticatedUser = result?.data?.user;
      if (!authenticatedUser?.is_admin) {
        await apiFetch("/api/auth/logout/", { method: "POST" }).catch(() => {});
        setError("This account is not an admin. Use an admin account to continue.");
        return;
      }
      onAuthenticated(authenticatedUser);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_42%,#fef3c7_100%)] px-4 py-6 text-slate-900 [&_button]:cursor-pointer">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">MedAssist</p>
              <h1 className="text-xl font-bold">Admin Portal</h1>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-amber-300/40 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <ShieldAlert className="h-4 w-4" />
              <p className="text-sm font-semibold">Restricted access</p>
            </div>
            <p className="mt-1 text-xs text-amber-700">Only users with admin privileges can continue.</p>
          </div>

          {error && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Admin Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200"
                placeholder="admin@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200"
                placeholder="Enter password"
              />
            </label>

            <button
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {loading ? "Signing in..." : "Sign in to Admin"}
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToLanding}
            className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Home
          </button>
        </section>
      </div>
    </div>
  );
};

export default AdminAuthPage;
