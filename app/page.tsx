"use client";

import React, { useState, useEffect } from "react";
import { Navbar, type ActiveTab } from "@/components/Navbar";
import { AuthModal, type AuthUser } from "@/components/AuthModal";
import { ActivityPlanner } from "@/components/activities/ActivityPlanner";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { DocumentGenerator } from "@/components/documents/DocumentGenerator";
import { TemplateCustomizer } from "@/components/templates/TemplateCustomizer";
import { useToast } from "@/components/ui/Toast";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("activities");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Cross-module linking state
  const [linkedActivityId, setLinkedActivityId] = useState<number | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: AuthUser }) => {
        if (isMounted && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showToast("Berhasil Logout", "Sesi Anda telah diakhiri", "info");
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user?: AuthUser };
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch {
      // ignore
    }
  };

  const handleNavigateToBudget = (activityId: number) => {
    setLinkedActivityId(activityId);
    setActiveTab("budget");
  };

  const handleNavigateToLetter = (activityId: number) => {
    setLinkedActivityId(activityId);
    setActiveTab("documents");
  };

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

        {activeTab === "budget" && (
          <BudgetPlanner
            initialActivityId={linkedActivityId}
            onSelectLetter={handleNavigateToLetter}
          />
        )}

        {activeTab === "documents" && (
          <DocumentGenerator initialActivityId={linkedActivityId} />
        )}

        {activeTab === "templates" && <TemplateCustomizer />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 sm:py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div className="font-medium text-slate-700">
            <b>CRMForU System</b> • Activity Planner, Budget Planning & Document Generator
          </div>
          <div className="text-[11px] text-slate-400">
            OpenXML (.docx) Engine • Drizzle ORM • Next.js App Router
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
