import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";

const GOOGLE_SCRIPT_ID = "google-identity-script";

const AuthPage = ({ onAuthenticated, initialMode = "login", onBackToLanding }) => {
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const googleContainerRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    setMode(initialMode === "register" ? "register" : "login");
  }, [initialMode]);

  useEffect(() => {
    if (!googleClientId || !googleContainerRef.current) return;

    const initGoogleButton = () => {
      if (!window.google || !googleContainerRef.current) return;
      googleContainerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setError("");
          setInfo("");
          setLoading(true);
          try {
            const result = await apiFetch("/api/auth/google/", {
              method: "POST",
              body: { credential: response.credential },
            });
            onAuthenticated(result.data.user);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleContainerRef.current, {
        theme: "filled_blue",
        size: "large",
        width: 300,
        text: mode === "register" ? "signup_with" : "signin_with",
      });
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleButton;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", initGoogleButton);
    }
  }, [googleClientId, onAuthenticated, mode]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const result = await apiFetch("/api/auth/login/", {
        method: "POST",
        body: { email: form.email, password: form.password },
      });
      onAuthenticated(result.data.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const result = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: form,
      });
      setInfo(result.message || "Registration successful. You can sign in now.");
      setMode("login");
      setForm((prev) => ({ ...prev, password: "", confirm_password: "" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f8fafc_0%,#e0f2fe_42%,#fef3c7_100%)] px-4 py-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl border border-white/60 bg-white/75 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-xl md:p-6">
          <div className="space-y-4">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            )}

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                <HeartPulse className="h-3.5 w-3.5" />
                MedAssist
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {mode === "login" ? "Login to MedAssist" : "Register for MedAssist"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {mode === "login" ? "Welcome back. Continue your patient conversations." : "Create your account to get started."}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-1.5 shadow ring-1 ring-slate-200">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
                <button
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </div>
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            {info && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{info}</p>}

            {mode === "login" && (
              <form className="space-y-2.5" onSubmit={handleLogin}>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:brightness-105 disabled:opacity-60"
                >
                  {loading ? "Please wait..." : "Login"}
                </button>
              </form>
            )}

            {mode === "register" && (
              <form className="space-y-2.5" onSubmit={handleRegister}>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                />
                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:brightness-105 disabled:opacity-60"
                >
                  {loading ? "Please wait..." : "Create account"}
                </button>
              </form>
            )}

            <div className="pt-1">
              {googleClientId ? (
                <div ref={googleContainerRef} className="flex justify-center" />
              ) : (
                <p className="text-center text-xs text-slate-500">Set `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.</p>
              )}
            </div>

            <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secure account access with protected sessions
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
