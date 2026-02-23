import React, { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Moon, Palette, Save, ShieldCheck, Sun } from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    subtitle: "Soft clean daylight look",
    swatch: "bg-[linear-gradient(145deg,#ffffff_0%,#eef2ff_55%,#e0f2fe_100%)]",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    subtitle: "Low-glare night mode",
    swatch: "bg-[linear-gradient(145deg,#1f2937_0%,#111827_60%,#0b1220_100%)]",
    Icon: Moon,
  },
];

const SettingsPage = ({ preferredTheme, onThemeUpdated, onBack }) => {
  const [theme, setTheme] = useState(preferredTheme || "light");
  const [themeSaving, setThemeSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isPasswordRequired, setIsPasswordRequired] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    setTheme(preferredTheme || "light");
  }, [preferredTheme]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiFetch("/api/auth/settings/");
        const loadedTheme = response?.data?.settings?.preferred_theme;
        if (loadedTheme) {
          setTheme(loadedTheme);
          onThemeUpdated?.(loadedTheme);
        }
        setIsPasswordRequired(response?.data?.settings?.password_required ?? true);
      } catch {
        // keep local fallback
      }
    };
    loadSettings();
  }, [onThemeUpdated]);

  const saveTheme = async () => {
    setThemeSaving(true);
    setError("");
    setInfo("");
    try {
      const response = await apiFetch("/api/auth/settings/", {
        method: "PATCH",
        body: { preferred_theme: theme },
      });
      const savedTheme = response?.data?.settings?.preferred_theme || theme;
      onThemeUpdated?.(savedTheme);
      setInfo(response?.message || "Theme updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update theme.");
    } finally {
      setThemeSaving(false);
    }
  };

  const updatePasswordField = (key, value) => setPasswordForm((prev) => ({ ...prev, [key]: value }));

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setError("");
    setInfo("");
    try {
      const response = await apiFetch("/api/auth/change-password/", {
        method: "POST",
        body: passwordForm,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setInfo(response?.message || "Password changed successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-xl border border-slate-300/45 bg-slate-100/75 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="rounded-3xl border border-slate-300/45 p-5 frost-solid shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                <p className="text-sm text-slate-500">Theme and account security controls.</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/45 bg-slate-100/75 px-3 py-1.5 text-[11px] text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold">Account protected</span>
            </div>
          </div>
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p>}

        <section className="rounded-3xl border border-slate-300/45 p-5 frost-solid shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/25">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Theme Preferences</h2>
              <p className="text-sm text-slate-500">Choose how MedAssist looks for you.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  theme === option.value ? "border-blue-500 ring-2 ring-blue-200/45 bg-slate-100/75" : "border-slate-300/60 bg-slate-100/60 hover:border-slate-400/60"
                }`}
              >
                <div className={`h-12 rounded-lg ${option.swatch} p-2 flex items-start justify-between`}>
                  <option.Icon className={`h-4 w-4 ${option.value === "dark" ? "text-slate-100" : "text-amber-500"}`} />
                  {theme === option.value ? (
                    <span className="rounded-full bg-slate-50/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">Active</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{option.label}</p>
                <p className="text-xs text-slate-500">{option.subtitle}</p>
              </button>
            ))}
          </div>

          <button
            onClick={saveTheme}
            disabled={themeSaving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {themeSaving ? "Saving..." : "Save Theme"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-300/45 p-5 frost-solid shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200/70 text-slate-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-500">Update your account password securely.</p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={changePassword}>
            {isPasswordRequired ? (
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => updatePasswordField("current_password", e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/70 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45"
              />
            ) : (
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                You signed in with Google, so current password is not required.
              </p>
            )}
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => updatePasswordField("new_password", e.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border border-slate-300/65 bg-slate-100/70 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45"
            />
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => updatePasswordField("confirm_password", e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-300/65 bg-slate-100/70 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45"
            />
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {passwordSaving ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
