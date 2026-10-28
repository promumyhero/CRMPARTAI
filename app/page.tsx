"use client";

import React, { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { Navbar, type ActiveTab } from "@/components/Navbar";
import { LoginPage, type AuthUserData } from "@/components/auth/LoginPage";
import { useToast } from "@/components/ui/Toast";
import { normalizeRole, hasPermission } from "@/lib/auth/roles";
import { Shield, RefreshCw } from "lucide-react";

// Fallback skeleton loader while lazy chunks are fetched
function TabLoadingSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse shadow-xs">
        <div className="space-y-2">
          <div className="h-6 w-48 sm:w-64 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-60 sm:w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-semibold text-slate-400">
          {title}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded" />
            <div className="h-16 w-full bg-slate-50 rounded-lg border border-slate-100" />
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy loaded heavy modules for rapid initial page load & code splitting
const ActivityPlanner = dynamic(
  () => import("@/components/activities/ActivityPlanner").then((m) => m.ActivityPlanner),
  { loading: () => <TabLoadingSkeleton title="Agenda Kegiatan" /> }
);

const BudgetPlanner = dynamic(
  () => import("@/components/budget/BudgetPlanner").then((m) => m.BudgetPlanner),
  { loading: () => <TabLoadingSkeleton title="Budget Planning (RAB)" /> }
);

const DocumentGenerator = dynamic(
  () => import("@/components/documents/DocumentGenerator").then((m) => m.DocumentGenerator),
  { loading: () => <TabLoadingSkeleton title="Format Surat & Dokumen" /> }
);

const MemberDirectory = dynamic(
  () => import("@/components/members/MemberDirectory").then((m) => m.MemberDirectory),
  { loading: () => <TabLoadingSkeleton title="Database & Direktori Kader" /> }
);

const TemplateCustomizer = dynamic(
  () => import("@/components/templates/TemplateCustomizer").then((m) => m.TemplateCustomizer),
  { loading: () => <TabLoadingSkeleton title="Format Surat Resmi" /> }
);

const UserManager = dynamic(
  () => import("@/components/users/UserManager").then((m) => m.UserManager),
  { loading: () => <TabLoadingSkeleton title="Manajemen Pengguna" /> }
);

const AuthModal = dynamic(
  () => import("@/components/AuthModal").then((m) => m.AuthModal),
  { ssr: false }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("activities");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Cross-module linking state
  const [linkedActivityId, setLinkedActivityId] = useState<number | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
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
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showToast("Berhasil Keluar", "Sesi login Anda telah diakhiri", "info");
      setActiveTab("activities");
    } catch {
      setCurrentUser(null);
    }
  };

  const handleLoginSuccess = (user: AuthUserData) => {
    setCurrentUser(user);
    showToast("Berhasil Masuk", `Selamat datang, ${user.name}`, "success");
  };

  const [, startTransition] = useTransition();

  const handleTabChange = (tab: ActiveTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const handleNavigateToBudget = (activityId: number) => {
    startTransition(() => {
      setLinkedActivityId(activityId);
      setActiveTab("budget");
    });
  };

  const handleNavigateToLetter = (activityId: number) => {
    startTransition(() => {
      setLinkedActivityId(activityId);
      setActiveTab("documents");
    });
  };

  // Loading Screen while checking auth session cookie
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-blue-500/30 animate-pulse">
          C
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Memeriksa sesi keamanan...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render secure login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const normRole = normalizeRole(currentUser.role);
  const canViewBudget = hasPermission(normRole, "budget:view");
  const canManageTemplates = hasPermission(normRole, "templates:manage");
  const canManageUsers = hasPermission(normRole, "users:manage");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAuth={() => setAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Tailored margins for mobile, tablet, and desktop) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8">
        <div key={activeTab} className="animate-fade-in">
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

          {activeTab === "documents" && (
            <DocumentGenerator initialActivityId={linkedActivityId} />
          )}

          {activeTab === "members" && <MemberDirectory />}

          {activeTab === "templates" && canManageTemplates && <TemplateCustomizer />}

          {activeTab === "users" && canManageUsers && <UserManager />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 sm:py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div className="font-medium text-slate-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
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
