"use client";

import React, { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { Navbar, type ActiveTab } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { LoginPage, type AuthUserData } from "@/components/auth/LoginPage";
import { useToast } from "@/components/ui/Toast";
import { normalizeRole, hasPermission } from "@/lib/auth/roles";
import { Shield, Lock } from "lucide-react";
import {
  AppShellSkeleton,
  ActivityPlannerSkeleton,
  BudgetPlannerSkeleton,
  DocumentGeneratorSkeleton,
  MemberDirectorySkeleton,
  TemplateCustomizerSkeleton,
  UserManagerSkeleton,
} from "@/components/ui/Skeleton";

// Lazy loaded modules with exact-fit layout skeletons for zero layout shift
const ActivityPlanner = dynamic(
  () => import("@/components/activities/ActivityPlanner").then((m) => m.ActivityPlanner),
  { loading: () => <ActivityPlannerSkeleton /> }
);

const BudgetPlanner = dynamic(
  () => import("@/components/budget/BudgetPlanner").then((m) => m.BudgetPlanner),
  { loading: () => <BudgetPlannerSkeleton /> }
);

const DocumentGenerator = dynamic(
  () => import("@/components/documents/DocumentGenerator").then((m) => m.DocumentGenerator),
  { loading: () => <DocumentGeneratorSkeleton /> }
);

const MemberDirectory = dynamic(
  () => import("@/components/members/MemberDirectory").then((m) => m.MemberDirectory),
  { loading: () => <MemberDirectorySkeleton /> }
);

const TemplateCustomizer = dynamic(
  () => import("@/components/templates/TemplateCustomizer").then((m) => m.TemplateCustomizer),
  { loading: () => <TemplateCustomizerSkeleton /> }
);

const UserManager = dynamic(
  () => import("@/components/users/UserManager").then((m) => m.UserManager),
  { loading: () => <UserManagerSkeleton /> }
);

const VALID_TABS: ReadonlyArray<ActiveTab> = [
  "activities",
  "budget",
  "documents",
  "members",
  "templates",
  "users",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      const paramTab = new URLSearchParams(window.location.search).get("tab") as ActiveTab | null;
      if (paramTab && VALID_TABS.includes(paramTab)) {
        return paramTab;
      }
    }
    return "activities";
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isPendingTab, startTabTransition] = useTransition();

  // Cross-module linking state
  const [linkedActivityId, setLinkedActivityId] = useState<number | null>(null);

  const { showToast } = useToast();

  const updateActiveTab = (tab: ActiveTab) => {
    startTabTransition(() => {
      setActiveTab(tab);
    });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const paramTab = new URLSearchParams(window.location.search).get("tab") as ActiveTab | null;
      if (paramTab && VALID_TABS.includes(paramTab)) {
        setActiveTab(paramTab);
      }
    };
    window.addEventListener("popstate", handlePopState);

    let isMounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { authenticated?: boolean; user?: AuthUserData }) => {
        if (isMounted) {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
          setLoadingAuth(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
          setLoadingAuth(false);
        }
      });

    return () => {
      isMounted = false;
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showToast("Berhasil Keluar", "Sesi login Anda telah diakhiri", "info");
      updateActiveTab("activities");
    } catch {
      setCurrentUser(null);
    }
  };

  const handleLoginSuccess = (user: AuthUserData) => {
    setCurrentUser(user);
    showToast("Berhasil Masuk", `Selamat datang, ${user.name}`, "success");
  };

  const handleNavigateToBudget = (activityId: number) => {
    setLinkedActivityId(activityId);
    updateActiveTab("budget");
  };

  const handleNavigateToLetter = (activityId: number) => {
    setLinkedActivityId(activityId);
    updateActiveTab("documents");
  };

  // Exact-fit App Shell Skeleton while checking auth session cookie (no harsh dark/light flash)
  if (loadingAuth) {
    return <AppShellSkeleton />;
  }

  // If not authenticated, render secure login page
  if (!currentUser) {
    return (
      <div className="page-transition-enter">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const normRole = normalizeRole(currentUser.role);
  const canViewBudget = hasPermission(normRole, "budget:view");
  const canGenerateDocs = hasPermission(normRole, "documents:generate");
  const canManageTemplates = hasPermission(normRole, "templates:manage");
  const canManageUsers = hasPermission(normRole, "users:manage");

  const isTabRestricted =
    (activeTab === "budget" && !canViewBudget) ||
    (activeTab === "documents" && !canGenerateDocs) ||
    (activeTab === "templates" && !canManageTemplates) ||
    (activeTab === "users" && !canManageUsers);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={updateActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Subtle Top Progress Indicator during Tab Transition */}
      {isPendingTab && (
        <div
          aria-hidden="true"
          className="h-0.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-blue-600 animate-pulse"
        />
      )}

      {/* Main Content Area with Smooth Page Transitions */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8">
        <div
          key={activeTab}
          className={`page-transition-enter ${isPendingTab ? "opacity-75 transition-opacity duration-150" : ""}`}
        >
          {isTabRestricted && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Lock className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Akses Modul Dibatasi</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Peran akun Anda saat ini (<b>{normRole.toUpperCase()}</b>) tidak memiliki izin untuk mengakses modul ini.
              </p>
              <button
                type="button"
                onClick={() => updateActiveTab("activities")}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Kembali ke Agenda Kegiatan
              </button>
            </div>
          )}

          {activeTab === "activities" && (
            <ActivityPlanner
              onSelectBudget={handleNavigateToBudget}
              onSelectLetter={handleNavigateToLetter}
            />
          )}

          {activeTab === "budget" && canViewBudget && (
            <BudgetPlanner
              initialActivityId={linkedActivityId}
              onSelectLetter={handleNavigateToLetter}
            />
          )}

          {activeTab === "documents" && canGenerateDocs && (
            <DocumentGenerator initialActivityId={linkedActivityId} />
          )}

          {activeTab === "members" && <MemberDirectory initialUser={currentUser} />}

          {activeTab === "templates" && canManageTemplates && <TemplateCustomizer />}

          {activeTab === "users" && canManageUsers && <UserManager />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 sm:py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div className="font-medium text-slate-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            <span>
              <b>CRM Partai</b> • Sistem Manajemen Kader, Kegiatan & Anggaran
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Terautentikasi: {currentUser.name} ({normRole.toUpperCase()})
          </div>
        </div>
      </footer>

      {/* Auth Modal (for switching or adding team accounts) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser({
            ...user,
            normalizedRole: normalizeRole(user.role),
          });
        }}
      />
    </div>
  );
}
