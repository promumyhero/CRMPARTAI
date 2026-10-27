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
  Shield,
} from "lucide-react";
import { ROLE_CONFIGS, normalizeRole, hasPermission } from "@/lib/auth/roles";

export type ActiveTab = "activities" | "budget" | "documents" | "members" | "templates" | "users";

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  currentUser: {
    id: number;
    name: string;
    email: string;
    role: string;
    city?: string | null;
    district?: string | null;
  } | null;
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

  const normRole = currentUser ? normalizeRole(currentUser.role) : "viewer";
  const roleConfig = ROLE_CONFIGS[normRole] || ROLE_CONFIGS.viewer;
  const canManageUsers = hasPermission(normRole, "users:manage");
  const canViewBudget = hasPermission(normRole, "budget:view");
  const canManageTemplates = hasPermission(normRole, "templates:manage");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm sm:text-base shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base">
                  CRM Partai
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 hidden xs:inline">
                  RBAC Secure
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">
                Kader • Teritorial • Agenda • RAB
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Tabs (lg and md) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => onTabChange("activities")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "activities"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Agenda Kegiatan</span>
            </button>

            {canViewBudget && (
              <button
                onClick={() => onTabChange("budget")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                  activeTab === "budget"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Anggaran & RAB</span>
              </button>
            )}

            <button
              onClick={() => onTabChange("documents")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "documents"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format Surat</span>
            </button>

            <button
              onClick={() => onTabChange("members")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "members"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Data Anggota & Kader</span>
            </button>

            {canManageTemplates && (
              <button
                onClick={() => onTabChange("templates")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                  activeTab === "templates"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            )}

            {canManageUsers && (
              <button
                onClick={() => onTabChange("users")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                  activeTab === "users"
                    ? "bg-white text-purple-600 shadow-xs"
                    : "text-slate-600 hover:text-purple-700 hover:bg-white/50"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Kelola User</span>
              </button>
            )}
          </nav>

          {/* Right Status & User Panel */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* DB Indicator */}
            <div
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium border bg-slate-50 text-slate-700 border-slate-200"
              title={
                dbStatus?.type === "postgres"
                  ? "Terhubung ke Database PostgreSQL / Supabase"
                  : "Penyimpanan Lokal Aktif"
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus?.type === "postgres" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                }`}
              />
              <span className="hidden sm:inline">
                {dbStatus?.type === "postgres" ? "DB Online" : "Local Storage"}
              </span>
            </div>

            {/* User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block max-w-44 truncate">
                  <div className="text-xs font-semibold text-slate-900 leading-tight truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleConfig.badgeBg} ${roleConfig.badgeColor}`}
                    >
                      {roleConfig.label.split(" (")[0]}
                    </span>
                    {currentUser.district && (
                      <span className="text-[9px] text-slate-400 truncate">
                        • Kec. {currentUser.district}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout / Keluar Sesi"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masuk</span>
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

          {canViewBudget && (
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
          )}

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

          {canManageTemplates && (
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
          )}

          {canManageUsers && (
            <button
              onClick={() => onTabChange("users")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold shrink-0 text-xs transition ${
                activeTab === "users"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>User</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
