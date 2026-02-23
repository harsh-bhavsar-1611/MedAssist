import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import AuthPage from "./components/AuthPage";
import LandingPage from "./components/LandingPage";
import AdminPanel from "./components/AdminPanel";
import AdminAuthPage from "./components/AdminAuthPage";
import { apiFetch } from "./lib/api";

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  };

  const isAdminRoute = path.startsWith("/admin");

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout/", { method: "POST" });
    } catch {
      // Force local logout even if server logout fails.
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await apiFetch("/api/auth/csrf/");
        const me = await apiFetch("/api/auth/me/");
        setUser(me?.data?.user || null);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

  if (authLoading) {
    return <div className="h-screen bg-slate-100 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!user) {
    if (isAdminRoute) {
      return <AdminAuthPage onAuthenticated={setUser} onBackToLanding={() => navigate("/")} />;
    }

    if (path === "/") {
      return <LandingPage onGoToLogin={() => navigate("/login")} onGoToRegister={() => navigate("/register")} />;
    }

    return (
      <AuthPage
        onAuthenticated={setUser}
        initialMode={path === "/register" ? "register" : "login"}
        onBackToLanding={() => navigate("/")}
      />
    );
  }

  if (isAdminRoute) {
    if (!user?.is_admin) {
      return (
        <div className="min-h-screen app-backdrop px-4 py-6">
          <div className="mx-auto mt-20 max-w-lg rounded-3xl border border-red-200 bg-white/85 p-6 text-center shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Access Denied</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Admin access required</h1>
            <p className="mt-2 text-sm text-slate-600">Your account does not have admin permissions for this panel.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to chat app
            </button>
          </div>
        </div>
      );
    }

    return <AdminPanel user={user} onBackToApp={() => navigate("/")} onLogout={handleLogout} />;
  }

  return <Layout user={user} onUserChange={setUser} />;
}

export default App;
