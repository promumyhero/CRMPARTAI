"use client";

import React, { useState, useEffect } from "react";
import { Navbar, type ActiveTab } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { LoginPage, type AuthUserData } from "@/components/auth/LoginPage";
import { ActivityPlanner } from "@/components/activities/ActivityPlanner";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { DocumentGenerator } from "@/components/documents/DocumentGenerator";
import { TemplateCustomizer } from "@/components/templates/TemplateCustomizer";
import { MemberDirectory } from "@/components/members/MemberDirectory";
import { UserManager } from "@/components/users/UserManager";
import { useToast } from "@/components/ui/Toast";
import { normalizeRole, hasPermission } from "@/lib/auth/roles";
import { Shield, RefreshCw } from "lucide-react";

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

  const handleNavigateToBudget = (activityId: number) => {
    setLinkedActivityId(activityId);
    setActiveTab("budget");
  };

  const handleNavigateToLetter = (activityId: number) => {
    setLinkedActivityId(activityId);
    setActiveTab("documents");
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
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAuth={() => setAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Tailored margins for mobile, tablet, and desktop) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 lg:py-8">
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
