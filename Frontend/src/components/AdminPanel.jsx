import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Database,
  FileJson,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  Wrench,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { ApiError, apiFetch } from "../lib/api";

const navTabs = [
  { id: "overview", label: "Overview", icon: Activity, hoverIcon: Sparkles },
  { id: "users", label: "Users", icon: Users, hoverIcon: UserRound },
  { id: "medical", label: "Medical Data", icon: FileJson, hoverIcon: Database },
  { id: "health", label: "System Health", icon: ShieldCheck, hoverIcon: Wrench },
  { id: "audit", label: "Audit Logs", icon: ClipboardList, hoverIcon: ClipboardList },
];

const INITIAL_MEDICAL_FORM = {
  symptoms: "",
  possible_diagnosis: "",
  advice: "",
  medications: "",
};

const AdminPanel = ({ user, onBackToApp, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredTab, setHoveredTab] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSummary, setUserSummary] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userSort, setUserSort] = useState("date_joined");
  const [userDir, setUserDir] = useState("desc");
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, total_pages: 1, total: 0, page_size: 20 });

  const [medicalRows, setMedicalRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [medicalStats, setMedicalStats] = useState(null);
  const [medicalForm, setMedicalForm] = useState(INITIAL_MEDICAL_FORM);
  const [loadingMedical, setLoadingMedical] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [medicalPage, setMedicalPage] = useState(1);
  const [medicalRowsPerPage] = useState(10);
  const [medicalVersions, setMedicalVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionPage, setVersionPage] = useState(1);
  const [versionPagination, setVersionPagination] = useState({ page: 1, total_pages: 1, total: 0, page_size: 5 });
  const [restoringVersionId, setRestoringVersionId] = useState(null);

  const [health, setHealth] = useState(null);
  const [probeModel, setProbeModel] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ page: 1, total_pages: 1, total: 0, page_size: 20 });

  const parseError = (err, fallback) => (err instanceof ApiError ? err.message : fallback);

  const loadOverview = async () => {
    setLoadingOverview(true);
    setError("");
    try {
      const response = await apiFetch("/api/admin/overview/");
      setOverview(response?.data || null);
    } catch (err) {
      setError(parseError(err, "Could not load overview."));
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadUsers = async (query = "", role = "all", status = "all", sort = "date_joined", dir = "desc", page = 1) => {
    setLoadingUsers(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("role", role);
      params.set("status", status);
      params.set("sort", sort);
      params.set("dir", dir);
      params.set("page", String(page));
      params.set("page_size", "20");
      const response = await apiFetch(`/api/admin/users/?${params.toString()}`);
      setUsers(response?.data?.users || []);
      setUserSummary(response?.data?.summary || null);
      setUserPagination(response?.data?.pagination || { page: 1, total_pages: 1, total: 0, page_size: 20 });
    } catch (err) {
      setError(parseError(err, "Could not load users."));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadMedicalRows = async () => {
    setLoadingMedical(true);
    setError("");
    try {
      const response = await apiFetch("/api/admin/medical-data/");
      const rows = Array.isArray(response?.data?.medical_data) ? response.data.medical_data : [];
      setMedicalRows(rows);
      setMedicalPage(1);
      setMedicalStats(response?.data?.stats || null);
    } catch (err) {
      setError(parseError(err, "Could not load medical data."));
    } finally {
      setLoadingMedical(false);
    }
  };

  const loadMedicalVersions = async (page = 1) => {
    setLoadingVersions(true);
    setError("");
    try {
      const response = await apiFetch(`/api/admin/medical-data/versions/?page=${page}&page_size=5`);
      setMedicalVersions(response?.data?.versions || []);
      setVersionPagination(response?.data?.pagination || { page: 1, total_pages: 1, total: 0, page_size: 5 });
    } catch (err) {
      setError(parseError(err, "Could not load medical versions."));
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadHealth = async (withProbe = false) => {
    setLoadingHealth(true);
    setError("");
    try {
      const suffix = withProbe ? "?probe=1" : "";
      const response = await apiFetch(`/api/admin/health/${suffix}`);
      setHealth(response?.data || null);
    } catch (err) {
      setError(parseError(err, "Could not load system health."));
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/api/admin/audit-logs/?page=${page}&page_size=20`);
      setAuditLogs(response?.data?.logs || []);
      setAuditPagination(response?.data?.pagination || { page: 1, total_pages: 1, total: 0, page_size: 20 });
    } catch (err) {
      setError(parseError(err, "Could not load audit logs."));
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", user?.preferred_theme || "light");
    loadOverview();
  }, [user?.preferred_theme]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "users") loadUsers(userQuery, userRoleFilter, userStatusFilter, userSort, userDir, userPage);
    if (activeTab === "medical") {
      loadMedicalRows();
      loadMedicalVersions(versionPage);
    }
    if (activeTab === "health") loadHealth(probeModel);
    if (activeTab === "audit") loadAuditLogs(auditPage);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "users") return;
    const timer = setTimeout(() => {
      loadUsers(userQuery, userRoleFilter, userStatusFilter, userSort, userDir, userPage);
    }, 220);
    return () => clearTimeout(timer);
  }, [userQuery, userRoleFilter, userStatusFilter, userSort, userDir, userPage, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "medical") return;
    loadMedicalVersions(versionPage);
  }, [versionPage, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "audit") return;
    loadAuditLogs(auditPage);
  }, [auditPage, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const metrics = useMemo(() => overview?.metrics || {}, [overview]);
  const adminUsers = useMemo(() => users.filter((item) => item.is_staff), [users]);
  const regularUsers = useMemo(() => users.filter((item) => !item.is_staff), [users]);

  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  const toggleUserFlag = async (targetUser, field, value) => {
    setSavingUserId(targetUser.id);
    clearAlerts();
    try {
      const response = await apiFetch(`/api/admin/users/${targetUser.id}/`, {
        method: "PATCH",
        body: { [field]: value },
      });
      const updated = response?.data?.user;
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, ...updated } : item)));
      setSuccess("User permissions updated.");
    } catch (err) {
      setError(parseError(err, "Could not update user."));
    } finally {
      setSavingUserId(null);
    }
  };

  const onMedicalFormChange = (field, value) => {
    setMedicalForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMedicalEntry = () => {
    clearAlerts();
    const symptoms = medicalForm.symptoms
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const medications = medicalForm.medications
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!symptoms.length || !medicalForm.possible_diagnosis.trim() || !medicalForm.advice.trim()) {
      setError("Symptoms, diagnosis, and advice are required.");
      return;
    }

    const maxId = medicalRows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    const newRow = {
      id: maxId + 1,
      symptoms,
      possible_diagnosis: medicalForm.possible_diagnosis.trim(),
      advice: medicalForm.advice.trim(),
      medications,
    };
    setMedicalRows((prev) => [newRow, ...prev]);
    setMedicalPage(1);
    setMedicalForm(INITIAL_MEDICAL_FORM);
    setSuccess("Medical entry added locally. Click Save Changes to persist.");
  };

  const deleteMedicalEntry = (id) => {
    clearAlerts();
    setMedicalRows((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / medicalRowsPerPage));
      setMedicalPage((current) => Math.min(current, nextTotalPages));
      return next;
    });
    setSuccess("Entry removed locally. Click Save Changes to persist.");
  };

  const saveMedicalData = async () => {
    setSavingMedical(true);
    clearAlerts();
    try {
      const response = await apiFetch("/api/admin/medical-data/", {
        method: "PUT",
        body: { medical_data: medicalRows },
      });
      setMedicalStats((prev) => ({ ...(prev || {}), entries: response?.data?.entries || medicalRows.length }));
      setSuccess("Medical data saved.");
    } catch (err) {
      setError(parseError(err, "Could not save medical data."));
    } finally {
      setSavingMedical(false);
    }
  };

  const toggleRowExpanded = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const restoreMedicalVersion = async (id) => {
    setRestoringVersionId(id);
    clearAlerts();
    try {
      await apiFetch(`/api/admin/medical-data/restore/${id}/`, { method: "POST" });
      await loadMedicalRows();
      await loadMedicalVersions(versionPage);
      setSuccess("Medical data restored successfully.");
    } catch (err) {
      setError(parseError(err, "Could not restore version."));
    } finally {
      setRestoringVersionId(null);
    }
  };

  const pagedMedicalRows = useMemo(() => {
    const start = (medicalPage - 1) * medicalRowsPerPage;
    return medicalRows.slice(start, start + medicalRowsPerPage);
  }, [medicalRows, medicalPage, medicalRowsPerPage]);
  const medicalTotalPages = useMemo(
    () => Math.max(1, Math.ceil((medicalRows?.length || 0) / medicalRowsPerPage)),
    [medicalRows, medicalRowsPerPage]
  );

  return (
    <div className="min-h-screen app-backdrop text-slate-900 [&_button]:cursor-pointer">
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl [background:var(--surface-2)] [border-color:var(--surface-border)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/30">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">MedAssist Admin</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Operations Console</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-300/50 bg-slate-50/80 p-1 pr-3 transition-all hover:bg-slate-100/90"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-300/70 bg-slate-200 text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden text-sm font-semibold text-slate-700 md:block">{user?.name || "Admin"}</span>
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-300/45 py-2 shadow-xl shadow-slate-900/10 frost-solid animate-in fade-in slide-in-from-top-2">
                  <div className="border-b border-slate-300/40 px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-800">{user?.name || "Admin Account"}</p>
                    <p className="text-xs text-slate-500">{user?.email || ""}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onBackToApp();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100/70 hover:text-blue-600"
                  >
                    <Settings className="h-4 w-4" /> Back to User App
                  </button>
                  <div className="my-1 border-t border-slate-300/40" />
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50/80"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 md:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="frost-panel h-fit rounded-2xl p-3">
          <nav className="space-y-1.5">
            {navTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;
              const Icon = isHovered ? tab.hoverIcon : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab("")}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    isSelected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100/80"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 transition ${isHovered ? "scale-110" : ""}`} />
                    {tab.label}
                  </span>
                  <ArrowRight className={`h-3.5 w-3.5 transition ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`} />
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          {(error || success) && (
            <div className="space-y-2">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
            </div>
          )}

          {activeTab === "overview" && (
            <section className="space-y-4">
              <div className="frost-panel rounded-2xl p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Overview</h2>
                  <button onClick={loadOverview} className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold">
                    {loadingOverview ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <MetricCard icon={Users} title="Total Users" value={metrics.total_users} tone="blue" />
                  <MetricCard icon={BadgeCheck} title="Active Users" value={metrics.active_users} tone="emerald" />
                  <MetricCard icon={ShieldCheck} title="Active Admins" value={metrics.active_admin_users} tone="indigo" />
                  <MetricCard icon={MessageCircle} title="Total Messages" value={metrics.total_messages} tone="sky" />
                  <MetricCard icon={Activity} title="Bot Messages" value={metrics.bot_messages} tone="violet" />
                  <MetricCard icon={FileJson} title="Medical Entries" value={metrics.medical_entries} tone="amber" />
                </div>
              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section className="space-y-4">
              <div className="frost-panel rounded-2xl p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto text-xl font-bold">Users</h2>
                  <input
                    value={userQuery}
                    onChange={(event) => {
                      setUserPage(1);
                      setUserQuery(event.target.value);
                    }}
                    placeholder="Search user by name/email"
                    className="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm outline-none focus:border-blue-400 md:w-80"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(event) => {
                      setUserPage(1);
                      setUserRoleFilter(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(event) => {
                      setUserPage(1);
                      setUserStatusFilter(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={userSort}
                    onChange={(event) => {
                      setUserPage(1);
                      setUserSort(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm"
                  >
                    <option value="date_joined">Joined Date</option>
                    <option value="last_login">Last Login</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="session_count">Sessions</option>
                    <option value="message_count">Messages</option>
                  </select>
                  <select
                    value={userDir}
                    onChange={(event) => {
                      setUserPage(1);
                      setUserDir(event.target.value);
                    }}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                  <button
                    onClick={() => loadUsers(userQuery, userRoleFilter, userStatusFilter, userSort, userDir, userPage)}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold"
                  >
                    {loadingUsers ? "Loading..." : "Search"}
                  </button>
                  {userQuery && (
                    <button
                      onClick={() => {
                        setUserPage(1);
                        setUserQuery("");
                      }}
                      className="rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold hover:bg-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <SmallStat label="Total Listed" value={userSummary?.total ?? users.length} />
                  <SmallStat label="Admins" value={userSummary?.admins ?? adminUsers.length} />
                  <SmallStat label="Users" value={userSummary?.regular_users ?? regularUsers.length} />
                </div>

                <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Admins</h3>
                <UsersTable rows={adminUsers} onToggle={toggleUserFlag} savingUserId={savingUserId} />

                <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Regular Users</h3>
                <UsersTable rows={regularUsers} onToggle={toggleUserFlag} savingUserId={savingUserId} />
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    disabled={userPagination.page <= 1}
                    onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-600">
                    Page {userPagination.page || 1} of {userPagination.total_pages || 1}
                  </span>
                  <button
                    disabled={(userPagination.page || 1) >= (userPagination.total_pages || 1)}
                    onClick={() => setUserPage((prev) => Math.min(userPagination.total_pages || 1, prev + 1))}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "medical" && (
            <section className="space-y-4">
              <div className="frost-panel rounded-2xl p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto text-xl font-bold">Medical JSON Manager</h2>
                  <span className="text-xs text-slate-500">Entries: {medicalStats?.entries ?? medicalRows.length}</span>
                  <button onClick={loadMedicalRows} className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold">
                    {loadingMedical ? "Loading..." : "Reload"}
                  </button>
                  <button onClick={saveMedicalData} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
                    {savingMedical ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 md:p-4">
                  <p className="mb-3 text-sm font-semibold">Add New Record</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={medicalForm.symptoms}
                      onChange={(event) => onMedicalFormChange("symptoms", event.target.value)}
                      placeholder="Symptoms (comma separated)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      value={medicalForm.medications}
                      onChange={(event) => onMedicalFormChange("medications", event.target.value)}
                      placeholder="Medications (comma separated)"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      value={medicalForm.possible_diagnosis}
                      onChange={(event) => onMedicalFormChange("possible_diagnosis", event.target.value)}
                      placeholder="Possible diagnosis"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      value={medicalForm.advice}
                      onChange={(event) => onMedicalFormChange("advice", event.target.value)}
                      placeholder="Advice"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <button onClick={addMedicalEntry} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                    Add Entry
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Diagnosis</th>
                        <th className="px-3 py-2">Symptoms</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedMedicalRows.map((row) => (
                        <React.Fragment key={row.id}>
                          <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 font-semibold">{row.id}</td>
                            <td className="px-3 py-2">{row.possible_diagnosis}</td>
                            <td className="px-3 py-2">{(row.symptoms || []).slice(0, 3).join(", ")}</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleRowExpanded(row.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
                                >
                                  {expandedRows[row.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  View More
                                </button>
                                <button
                                  onClick={() => deleteMedicalEntry(row.id)}
                                  className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRows[row.id] && (
                            <tr className="border-b border-slate-100 bg-slate-50/70">
                              <td colSpan={4} className="px-3 py-3">
                                <div className="grid gap-2 text-xs md:grid-cols-2">
                                  <DetailItem label="Symptoms" value={(row.symptoms || []).join(", ")} />
                                  <DetailItem label="Diagnosis" value={row.possible_diagnosis} />
                                  <DetailItem label="Advice" value={row.advice} />
                                  <DetailItem label="Medications" value={(row.medications || []).join(", ")} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    disabled={medicalPage <= 1}
                    onClick={() => setMedicalPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-slate-600">
                    Page {medicalPage} of {medicalTotalPages}
                  </span>
                  <button
                    disabled={medicalPage >= medicalTotalPages}
                    onClick={() => setMedicalPage((prev) => Math.min(medicalTotalPages, prev + 1))}
                    className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-3 md:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Version History</p>
                    <button
                      onClick={() => loadMedicalVersions(versionPage)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold"
                    >
                      {loadingVersions ? "Loading..." : "Refresh"}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-600">
                          <th className="px-2 py-2">Version</th>
                          <th className="px-2 py-2">Created</th>
                          <th className="px-2 py-2">By</th>
                          <th className="px-2 py-2">Entries</th>
                          <th className="px-2 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicalVersions.map((version) => (
                          <tr key={version.id} className="border-b border-slate-100">
                            <td className="px-2 py-2">#{version.id}</td>
                            <td className="px-2 py-2">{version.created_at ? new Date(version.created_at).toLocaleString() : "-"}</td>
                            <td className="px-2 py-2">{version.actor_email || "system"}</td>
                            <td className="px-2 py-2">{version.entries || 0}</td>
                            <td className="px-2 py-2">
                              <button
                                disabled={restoringVersionId === version.id}
                                onClick={() => restoreMedicalVersion(version.id)}
                                className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 disabled:opacity-50"
                              >
                                {restoringVersionId === version.id ? "Restoring..." : "Restore"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      disabled={versionPagination.page <= 1}
                      onClick={() => setVersionPage((prev) => Math.max(1, prev - 1))}
                      className="rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-slate-600">
                      Page {versionPagination.page || 1} of {versionPagination.total_pages || 1}
                    </span>
                    <button
                      disabled={(versionPagination.page || 1) >= (versionPagination.total_pages || 1)}
                      onClick={() => setVersionPage((prev) => Math.min(versionPagination.total_pages || 1, prev + 1))}
                      className="rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "health" && (
            <section className="frost-panel rounded-2xl p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-xl font-bold">System Health</h2>
                <label className="flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1 text-xs">
                  <input type="checkbox" checked={probeModel} onChange={(event) => setProbeModel(event.target.checked)} />
                  Run model probe
                </label>
                <button onClick={() => loadHealth(probeModel)} className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold">
                  {loadingHealth ? "Checking..." : "Check Health"}
                </button>
              </div>

              <div className="mb-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                <p className={`text-sm font-bold ${health?.status === "healthy" ? "text-emerald-700" : "text-amber-700"}`}>
                  Overall: {(health?.status || "-").toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-slate-600">Fallback replies: {health?.response_quality?.fallback_reply_count ?? "-"}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <HealthCard title="Database" icon={Database} check={health?.checks?.database} />
                <HealthCard title="Medical JSON" icon={FileJson} check={health?.checks?.medical_json} />
                <HealthCard title="Model Config" icon={Wrench} check={health?.checks?.model_config} />
              </div>

              {health?.probe && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Live Model Probe</p>
                  <p className={`mt-2 text-sm font-semibold ${health.probe.ok ? "text-emerald-700" : "text-red-700"}`}>
                    {health.probe.ok ? "Success" : "Failed"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{health.probe.detail}</p>
                </div>
              )}
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Errors</p>
                {!health?.recent_errors?.length ? (
                  <p className="mt-2 text-sm text-slate-500">No recent admin/system errors logged.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {health.recent_errors.map((err) => (
                      <article key={err.id} className="rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-2">
                        <p className="text-xs font-semibold text-red-700">{err.action}</p>
                        <p className="text-[11px] text-red-600">{err.created_at ? new Date(err.created_at).toLocaleString() : "-"}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "audit" && (
            <section className="frost-panel rounded-2xl p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Audit Logs</h2>
                <button onClick={() => loadAuditLogs(auditPage)} className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold">
                  {auditLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Actor</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Entity</th>
                      <th className="px-3 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-2 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                        <td className="px-3 py-2 text-xs">{log.actor_email || "system"}</td>
                        <td className="px-3 py-2 text-xs font-semibold">{log.action}</td>
                        <td className="px-3 py-2 text-xs">{log.entity_type}:{log.entity_id || "-"}</td>
                        <td className="px-3 py-2 text-xs">
                          <pre className="max-w-[420px] overflow-x-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  disabled={auditPagination.page <= 1}
                  onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-600">
                  Page {auditPagination.page || 1} of {auditPagination.total_pages || 1}
                </span>
                <button
                  disabled={(auditPagination.page || 1) >= (auditPagination.total_pages || 1)}
                  onClick={() => setAuditPage((prev) => Math.min(auditPagination.total_pages || 1, prev + 1))}
                  className="rounded-lg border border-slate-300 bg-white/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, tone }) => {
  const IconComponent = icon;
  const toneClasses = {
    blue: "from-blue-500/20 to-cyan-500/5 border-blue-200/70",
    emerald: "from-emerald-500/20 to-green-500/5 border-emerald-200/70",
    indigo: "from-indigo-500/20 to-blue-500/5 border-indigo-200/70",
    sky: "from-sky-500/20 to-blue-500/5 border-sky-200/70",
    violet: "from-violet-500/20 to-indigo-500/5 border-violet-200/70",
    amber: "from-amber-500/20 to-yellow-500/5 border-amber-200/70",
  };

  return (
    <article className={`rounded-xl border bg-gradient-to-br p-3 ${toneClasses[tone] || toneClasses.blue}`}>
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-slate-700" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{title}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? "-"}</p>
    </article>
  );
};

const SmallStat = ({ label, value }) => (
  <article className="rounded-xl border border-slate-200 bg-white/70 p-3">
    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold">{value ?? "-"}</p>
  </article>
);

const UsersTable = ({ rows, onToggle, savingUserId }) => {
  if (!rows.length) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-500">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Joined</th>
            <th className="px-3 py-2">Sessions</th>
            <th className="px-3 py-2">Messages</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lockAdmin = row.is_last_active_admin;
            return (
              <tr key={row.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2">
                  <p className="font-semibold">{row.name || "-"}</p>
                  <p className="text-xs text-slate-500">Gender: {row.gender || "n/a"}</p>
                </td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2">{row.date_joined ? new Date(row.date_joined).toLocaleDateString() : "-"}</td>
                <td className="px-3 py-2">{row.session_count ?? 0}</td>
                <td className="px-3 py-2">{row.message_count ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={savingUserId === row.id || lockAdmin}
                      onClick={() => onToggle(row, "is_active", !row.is_active)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {row.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      disabled={savingUserId === row.id || row.is_superuser || lockAdmin}
                      onClick={() => onToggle(row, "is_staff", !row.is_staff)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {row.is_staff ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                  {lockAdmin && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <CircleAlert className="h-3.5 w-3.5" />
                      Last active admin cannot be removed/deactivated.
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const HealthCard = ({ title, icon, check }) => {
  const IconComponent = icon;
  return (
    <article className="rounded-xl border border-slate-200 bg-white/70 p-3">
      <div className="flex items-center gap-2">
        <IconComponent className="h-4 w-4 text-slate-600" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className={`mt-2 text-sm font-bold ${check?.ok ? "text-emerald-700" : "text-red-700"}`}>{check?.ok ? "OK" : "Issue"}</p>
      <p className="mt-1 text-xs text-slate-600">{check?.detail || "-"}</p>
    </article>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 text-xs text-slate-700">{value || "-"}</p>
  </div>
);

export default AdminPanel;
