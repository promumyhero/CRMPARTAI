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
