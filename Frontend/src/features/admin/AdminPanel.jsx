import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Database,
  FileJson,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  Wrench,
  ClipboardList,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { ApiError, apiFetch } from "../../lib/api";

// Import our newly split components
import { OverviewTab } from "./components/OverviewTab";
import { UsersTab } from "./components/UsersTab";
import { MedicalDataTab } from "./components/MedicalDataTab";
import { HealthTab, AuditTab } from "./components/HealthAuditTabs";

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

  // --- OVERVIEW STATE ---
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // --- USERS STATE ---
  const [usersList, setUsersList] = useState([]);
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

  // --- MEDICAL DATA STATE ---
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

  // --- HEALTH & AUDIT STATE ---
  const [health, setHealth] = useState(null);
  const [probeModel, setProbeModel] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ page: 1, total_pages: 1, total: 0, page_size: 20 });

  const parseError = (err, fallback) => (err instanceof ApiError ? err.message : fallback);
  const clearAlerts = () => {
    setError("");
    setSuccess("");
  };

  // --- FETCHERS ---
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
      setUsersList(response?.data?.users || []);
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

  // --- ACTIONS ---
  const toggleUserFlag = async (targetUser, field, value) => {
    setSavingUserId(targetUser.id);
    clearAlerts();
    try {
      const response = await apiFetch(`/api/admin/users/${targetUser.id}/`, {
        method: "PATCH",
        body: { [field]: value },
      });
      const updated = response?.data?.user;
      setUsersList((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, ...updated } : item)));
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
    const symptoms = medicalForm.symptoms.split(",").map((item) => item.trim()).filter(Boolean);
    const medications = medicalForm.medications.split(",").map((item) => item.trim()).filter(Boolean);
    
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

  // --- EFFECTS ---
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
                    isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-700 hover:bg-slate-100/80"
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
            <OverviewTab 
              overview={overview} 
              loadingOverview={loadingOverview} 
              loadOverview={loadOverview} 
            />
          )}

          {activeTab === "users" && (
            <UsersTab 
              users={usersList}
              userSummary={userSummary}
              loadingUsers={loadingUsers}
              userQuery={userQuery} setUserQuery={setUserQuery}
              userRoleFilter={userRoleFilter} setUserRoleFilter={setUserRoleFilter}
              userStatusFilter={userStatusFilter} setUserStatusFilter={setUserStatusFilter}
              userSort={userSort} setUserSort={setUserSort}
              userDir={userDir} setUserDir={setUserDir}
              userPage={userPage} setUserPage={setUserPage}
              userPagination={userPagination}
              loadUsers={loadUsers}
              toggleUserFlag={toggleUserFlag}
              savingUserId={savingUserId}
            />
          )}

          {activeTab === "medical" && (
            <MedicalDataTab 
              medicalRows={medicalRows}
              expandedRows={expandedRows}
              medicalStats={medicalStats}
              medicalForm={medicalForm}
              loadingMedical={loadingMedical}
              savingMedical={savingMedical}
              medicalPage={medicalPage} setMedicalPage={setMedicalPage}
              medicalRowsPerPage={medicalRowsPerPage}
              medicalVersions={medicalVersions}
              loadingVersions={loadingVersions}
              versionPage={versionPage} setVersionPage={setVersionPage}
              versionPagination={versionPagination}
              restoringVersionId={restoringVersionId}
              loadMedicalRows={loadMedicalRows}
              saveMedicalData={saveMedicalData}
              onMedicalFormChange={onMedicalFormChange}
              addMedicalEntry={addMedicalEntry}
              deleteMedicalEntry={deleteMedicalEntry}
              toggleRowExpanded={(id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))}
              restoreMedicalVersion={restoreMedicalVersion}
              loadMedicalVersions={loadMedicalVersions}
            />
          )}

          {activeTab === "health" && (
            <HealthTab 
              health={health}
              loadingHealth={loadingHealth}
              probeModel={probeModel} setProbeModel={setProbeModel}
              loadHealth={loadHealth}
            />
          )}

          {activeTab === "audit" && (
            <AuditTab 
              auditLogs={auditLogs}
              auditLoading={auditLoading}
              auditPage={auditPage} setAuditPage={setAuditPage}
              auditPagination={auditPagination}
              loadAuditLogs={loadAuditLogs}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
