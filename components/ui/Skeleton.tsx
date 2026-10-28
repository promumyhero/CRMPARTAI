import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/70",
        className
      )}
      {...props}
    />
  );
}

// Specialized skeleton cards for metrics
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-2.5", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

// Specialized skeleton row for tables (Member & Budget)
export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full max-w-30" />
        </td>
      ))}
    </tr>
  );
}

// Specialized skeleton card for Activity Planner
export function SkeletonActivityCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4 max-w-sm" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex sm:flex-col items-end gap-1.5 min-w-32">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// Specialized skeleton grid for Monthly Calendar View
export function SkeletonCalendar() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <Skeleton className="h-6 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-24 p-1.5 border border-slate-100 rounded-lg space-y-1.5 bg-slate-50/40">
            <Skeleton className="h-4 w-6 rounded" />
            {i % 3 === 0 && <Skeleton className="h-3.5 w-full rounded" />}
            {i % 4 === 0 && <Skeleton className="h-3.5 w-4/5 rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// Exact-fit skeleton for Budget & RAB page (maintains exact margins & layout)
export function BudgetPlannerSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top View Selector Tab */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-semibold max-w-md animate-pulse">
        <div className="flex-1 py-2 h-8 rounded-lg bg-white shadow-xs" />
        <div className="flex-1 py-2 h-8 rounded-lg bg-transparent" />
      </div>

      {/* Top Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72 sm:w-96" />
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Skeleton className="h-9 w-40 sm:w-56 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Itemized Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-7 w-36 rounded-lg" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between px-3">
              <Skeleton className="h-3.5 w-48" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Exact-fit skeleton for Document Generator & Letter Format page
export function DocumentGeneratorSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-semibold max-w-md animate-pulse">
        <div className="flex-1 py-2 h-8 rounded-lg bg-white shadow-xs" />
        <div className="flex-1 py-2 h-8 rounded-lg bg-transparent" />
      </div>

      {/* Top Banner & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3.5 w-80 sm:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>

      {/* Form + Paper Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-pulse">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        {/* Right Preview Sheet (7 cols) */}
        <div className="lg:col-span-7 bg-slate-200/70 p-3 sm:p-6 rounded-xl border border-slate-200 flex justify-center">
          <div className="w-full max-w-198.5 min-h-120 bg-white rounded-lg shadow-sm p-6 sm:p-10 space-y-6 animate-pulse">
            <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between gap-4">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exact-fit skeleton for User Management (RBAC) page
export function UserManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-60" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-80 sm:w-96" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
        <Skeleton className="h-9 w-full sm:w-72 rounded-xl" />
        <Skeleton className="h-9 w-full sm:w-48 rounded-xl" />
      </div>

      {/* 3. User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <Skeleton className="h-3 w-28" />
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
