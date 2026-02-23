import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import Navbar from './Navbar';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import { cn } from '../lib/utils';
import { apiFetch, ApiError } from '../lib/api';

const Layout = ({ user, onUserChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('chat');
  const [currentTheme, setCurrentTheme] = useState(user?.preferred_theme || 'light');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));

  useEffect(() => {
    setCurrentTheme(user?.preferred_theme || 'light');
  }, [user?.preferred_theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme || 'light');
  }, [currentTheme]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const result = await apiFetch('/api/sessions/');
        const items = result?.data?.sessions || [];
        setSessions(items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load sessions.");
      }
    };

    loadSessions();
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => {
    if (activeView !== 'chat') {
      setActiveView('chat');
      setIsSidebarOpen(true);
      return;
    }
    setIsSidebarOpen(!isSidebarOpen);
  };

  const createNewChat = () => {
    setActiveView('chat');
    setCurrentSessionId(null);

    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  const selectSession = (sessionId) => {
    setActiveView('chat');
    setCurrentSessionId(sessionId);
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  const handleOpenProfile = () => {
    setActiveView('profile');
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const handleOpenSettings = () => {
    setActiveView('settings');
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const handleThemeUpdated = useCallback((theme) => {
    setCurrentTheme(theme);
    onUserChange((prev) => ({ ...prev, preferred_theme: theme }));
  }, [onUserChange]);

  const renameSession = async (sessionId, title) => {
    const result = await apiFetch(`/api/sessions/${sessionId}/title/`, {
      method: "PATCH",
      body: { title },
    });

    const updatedTitle = result?.data?.title || title;
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, title: updatedTitle } : session))
    );
  };

  const deleteSession = async (sessionId) => {
    await apiFetch(`/api/sessions/${sessionId}/`, { method: "DELETE" });
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout/', { method: 'POST' });
    } catch {
      // Force local logout even if server fails.
    } finally {
      onUserChange(null);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden font-sans app-backdrop">
      <div className="pointer-events-none absolute inset-0 opacity-80 [mask-image:radial-gradient(circle_at_center,black_45%,transparent_100%)]">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <Navbar
        onToggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
        onOpenSettings={handleOpenSettings}
        onOpenAdmin={() => {
          window.history.pushState({}, "", "/admin");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-1 pt-16">
        {error && (
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-red-200/80 bg-red-50/90 px-4 py-2 text-sm text-red-600 shadow-lg backdrop-blur">
            {error}
          </div>
        )}

        {activeView === 'chat' && (
          <div
            className={cn(
              "fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden transition-opacity duration-300",
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {activeView === 'chat' && (
          <div
            className={cn(
              "fixed left-0 top-16 bottom-0 z-30 h-full w-full transition-all duration-300 ease-in-out transform md:relative md:inset-y-0 md:w-auto",
              "md:translate-x-0",
              !isSidebarOpen && "md:w-0 md:opacity-0 md:overflow-hidden md:border-r-0",
              isSidebarOpen ? "w-[280px] translate-x-0" : "-translate-x-full md:translate-x-0 w-[280px]"
            )}
            style={{
              width: !isSidebarOpen && isDesktop ? '0px' : '280px'
            }}
          >
            <div className="h-full w-[280px] frost-panel border-r">
              <Sidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onNewChat={createNewChat}
                onSelectSession={selectSession}
                onRenameSession={renameSession}
                onDeleteSession={deleteSession}
              />
            </div>
          </div>
        )}

        <main className="relative flex h-full flex-1 flex-col overflow-hidden">
          {activeView === 'chat' ? (
            <ChatArea
              currentSessionId={currentSessionId}
              setCurrentSessionId={setCurrentSessionId}
              setSessions={setSessions}
            />
          ) : null}
          {activeView === 'profile' ? <ProfilePage onUserChange={onUserChange} onBack={() => setActiveView('chat')} /> : null}
          {activeView === 'settings' ? (
            <SettingsPage preferredTheme={currentTheme} onThemeUpdated={handleThemeUpdated} onBack={() => setActiveView('chat')} />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default Layout;
