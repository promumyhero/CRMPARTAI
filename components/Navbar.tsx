"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Calculator,
  FileText,
  Sliders,
  Users,
  LogOut,
  LogIn,
} from "lucide-react";

export type ActiveTab = "activities" | "budget" | "documents" | "members" | "templates";


interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  currentUser: { id: number; name: string; email: string; role: string } | null;
  onLogout: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  onOpenAuth,
  currentUser,
  onLogout,
}: NavbarProps) {
  const [dbStatus, setDbStatus] = useState<{ type: string; healthy: boolean } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.database) setDbStatus(data.database);
      })
      .catch(() => {
        if (isMounted) setDbStatus({ type: "local", healthy: true });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base">
                  CRMForU
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 hidden xs:inline">
                  PRD v1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">
                Activity • Budget • Native .docx
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Tabs (lg and md) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => onTabChange("activities")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === "activities"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Activity Planner</span>
            </button>
            <button
              onClick={() => onTabChange("budget")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === "budget"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Budget Planning</span>
            </button>
            <button
              onClick={() => onTabChange("documents")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === "documents"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format Surat (.docx)</span>
            </button>
            <button
              onClick={() => onTabChange("members")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === "members"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Data Anggota & Kader</span>
            </button>
            <button
              onClick={() => onTabChange("templates")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeTab === "templates"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Template Manager</span>
            </button>
          </nav>

          {/* Right Status & User Panel */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* DB Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200"
              title={
                dbStatus?.type === "postgres"
                  ? "Terhubung ke Database PostgreSQL (Drizzle ORM)"
                  : "Penyimpanan Lokal Aktif"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus?.type === "postgres" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                }`}
              />
              <span className="hidden sm:inline">
                {dbStatus?.type === "postgres" ? "PostgreSQL" : "Storage Siap"}
              </span>
            </div>

            {/* User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block max-w-[140px] truncate">
                  <div className="text-xs font-semibold text-slate-900 leading-tight truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{currentUser.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masuk Tim</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile & Small Device Responsive Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-1 text-xs no-scrollbar">
          <button
            onClick={() => onTabChange("activities")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
              activeTab === "activities"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Kegiatan</span>
          </button>
          <button
            onClick={() => onTabChange("budget")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
              activeTab === "budget"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Budget</span>
          </button>
          <button
            onClick={() => onTabChange("documents")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
              activeTab === "documents"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Surat</span>
          </button>
          <button
            onClick={() => onTabChange("members")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
              activeTab === "members"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kader</span>
          </button>
          <button
            onClick={() => onTabChange("templates")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
              activeTab === "templates"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Template</span>
          </button>
        </div>
      </div>
    </header>
  );
}

