import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Edit3, Mail, Save, UserCircle2 } from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
};

const ProfilePage = ({ onUserChange, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    birth_date: "",
    gender: "prefer_not_to_say",
    date_created: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch("/api/auth/profile/");
        const payload = response?.data?.profile;
        if (!payload) throw new Error("Profile response missing.");
        setForm({
          name: payload.name || "",
          email: payload.email || "",
          birth_date: payload.birth_date || "",
          gender: payload.gender || "prefer_not_to_say",
          date_created: payload.date_created || "",
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const result = await apiFetch("/api/auth/profile/", {
        method: "PATCH",
        body: {
          name: form.name,
          birth_date: form.birth_date || null,
          gender: form.gender,
        },
      });
      const nextProfile = result?.data?.profile;
      if (nextProfile) {
        setForm((prev) => ({
          ...prev,
          name: nextProfile.name || prev.name,
          birth_date: nextProfile.birth_date || "",
          gender: nextProfile.gender || prev.gender,
          email: nextProfile.email || prev.email,
          date_created: nextProfile.date_created || prev.date_created,
        }));
        onUserChange?.((prev) => ({ ...prev, name: nextProfile.name || prev?.name }));
      }
      setInfo(result?.message || "Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-full grid place-items-center text-slate-500">Loading profile...</div>;
  }

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
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/25">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Profile</h2>
                <p className="text-sm text-slate-500">Manage your patient account details.</p>
              </div>
            </div>
            <button
              onClick={() => setEditing((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/60 bg-slate-100/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Edit3 className="h-4 w-4" />
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-300/45 px-4 py-3 frost-solid">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Email</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail className="h-3.5 w-3.5 text-blue-500" />
              {form.email || "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300/45 px-4 py-3 frost-solid">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Member Since</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
              {formatDateTime(form.date_created)}
            </p>
          </div>
        </div>

        <form className="space-y-4 rounded-3xl border border-slate-300/45 p-5 frost-solid shadow-sm" onSubmit={handleSave}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name</span>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/75 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45 disabled:opacity-70"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</span>
              <input
                value={form.email}
                disabled
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/70 px-3 py-2.5 text-sm text-slate-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Birth Date</span>
              <input
                type="date"
                value={form.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/75 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45 disabled:opacity-70"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                disabled={!editing}
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/75 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/45 disabled:opacity-70"
              >
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date Created</span>
              <input
                value={formatDateTime(form.date_created)}
                disabled
                className="w-full rounded-xl border border-slate-300/65 bg-slate-100/70 px-3 py-2.5 text-sm text-slate-500"
              />
            </label>
          </div>

          {editing && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:brightness-105 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
