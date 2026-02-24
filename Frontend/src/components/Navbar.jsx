import React, { useState } from 'react';
import { Menu, User, Settings, LogOut, HeartPulse, Shield, FileText } from 'lucide-react';

const Navbar = ({ onToggleSidebar, user, onLogout, onOpenProfile, onOpenSettings, onOpenAdmin, onOpenReports, activeView }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl [background:var(--surface-2)] [border-color:var(--surface-border)]">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-300/50 bg-slate-50/70 p-2 text-slate-600 transition hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/30">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">MedAssist</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Smart Care Console</p>
          </div>
        </div>

        {/* <div className="hidden items-center gap-2 rounded-full border border-slate-300/45 bg-slate-50/75 px-3 py-1.5 text-xs text-slate-600 md:flex">
          {activeView === 'chat' ? <MessageCircleHeart className="h-3.5 w-3.5 text-blue-500" /> : <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />}
          <span className="font-semibold capitalize">{activeView}</span>
        </div> */}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenReports}
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition md:px-3 ${
            activeView === 'reports'
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-300/60 bg-white/80 text-slate-700 hover:bg-slate-100/90"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Medical Reports</span>
        </button>

      <div className="relative">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 rounded-full border border-slate-300/50 bg-slate-50/80 p-1 pr-3 transition-all hover:bg-slate-100/90"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-300/70 bg-slate-200 text-slate-600">
            <User className="w-5 h-5" />
          </div>
          <span className="hidden text-sm font-semibold text-slate-700 md:block">{user?.name || "User"}</span>
        </button>

        {isProfileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-300/45 py-2 shadow-xl shadow-slate-900/10 frost-solid animate-in fade-in slide-in-from-top-2">
              <div className="border-b border-slate-300/40 px-4 py-2.5">
                <p className="text-sm font-semibold text-slate-800">{user?.name || "My Account"}</p>
                <p className="text-xs text-slate-500">{user?.email || ""}</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onOpenProfile?.();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100/70 hover:text-blue-600"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onOpenSettings?.();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100/70 hover:text-blue-600"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              {user?.is_admin && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenAdmin?.();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100/70 hover:text-blue-600"
                >
                  <Shield className="w-4 h-4" /> Admin Panel
                </button>
              )}
              <div className="my-1 border-t border-slate-300/40" />
              <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50/80">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </nav>
  );
};

export default Navbar;
