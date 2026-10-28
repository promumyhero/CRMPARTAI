"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit2,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  List,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  SkeletonCard,
  SkeletonActivityCard,
  SkeletonCalendar,
} from "@/components/ui/Skeleton";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityItem {
  id: number;
  userId: number;
  title: string;
  category: string;
  location: string | null;
  picName: string | null;
  status: number; // 1: Draft, 2: Terjadwal, 3: Berjalan, 4: Selesai, 5: Dibatalkan
  startDate: string;
  endDate: string | null;
  checklist: ChecklistItem[];
  totalEstimatedBudget: string;
  totalActualBudget: string;
  createdAt: string;
}

const STATUS_LABELS: Record<
  number,
  { label: string; color: string; bg: string; border: string; badgeBg: string; badgeText: string }
> = {
  1: {
    label: "Draft",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 border-slate-300",
    badgeText: "text-slate-700",
  },
  2: {
    label: "Terjadwal",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-800",
  },
  3: {
    label: "Berjalan",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
  },
  4: {
    label: "Selesai",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-800",
  },
  5: {
    label: "Dibatalkan",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-rose-800",
  },
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAY_NAMES_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface ActivityPlannerProps {
  onSelectBudget: (activityId: number) => void;
  onSelectLetter: (activityId: number) => void;
}

export function ActivityPlanner({
  onSelectBudget,
  onSelectLetter,
}: ActivityPlannerProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-10-27");
  const [todayDateStr, setTodayDateStr] = useState<string>("2026-10-27");

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const d = now.getDate();
      const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      setCurrentYear(y);
      setCurrentMonth(m);
      setSelectedDateStr(str);
      setTodayDateStr(str);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Pelatihan");
  const [formLocation, setFormLocation] = useState("");
  const [formPicName, setFormPicName] = useState("");
  const [formStatus, setFormStatus] = useState<number>(2);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  const { showToast, showDeleteToast } = useToast();

  const fetchActivities = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (statusFilter !== "all") query.set("status", statusFilter);

      const res = await fetch(`/api/activities?${query.toString()}`);
      const data = (await res.json()) as { activities?: ActivityItem[] };
      if (data.activities) {
        setActivities(data.activities);
      }
    } catch {
      showToast("Error", "Gagal memuat daftar kegiatan", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivities();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  const handleOpenCreateModal = (prefillDate?: string) => {
    setEditingActivity(null);
    setFormTitle("");
    setFormCategory("Pelatihan");
    setFormLocation("");
    setFormPicName("");
    setFormStatus(2);

    let startIso: string;
    let endIso: string;

    if (prefillDate) {
      startIso = `${prefillDate}T09:00`;
      endIso = `${prefillDate}T13:00`;
    } else {
      const base = new Date(Date.now() + 86400000 * 2);
      startIso = base.toISOString().slice(0, 16);
      endIso = new Date(base.getTime() + 14400000).toISOString().slice(0, 16);
    }

    setFormStartDate(startIso);
    setFormEndDate(endIso);
    setFormChecklist([
      { id: "c-1", text: "Konfirmasi kesiapan tempat & sound system", done: false },
      { id: "c-2", text: "Pengajuan anggaran biaya operasional (RAB)", done: false },
      { id: "c-3", text: "Penerbitan surat undangan peserta/kader", done: false },
    ]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (act: ActivityItem) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormCategory(act.category || "Umum");
    setFormLocation(act.location || "");
    setFormPicName(act.picName || "");
    setFormStatus(act.status);
    setFormStartDate(act.startDate ? new Date(act.startDate).toISOString().slice(0, 16) : "");
    setFormEndDate(act.endDate ? new Date(act.endDate).toISOString().slice(0, 16) : "");
    setFormChecklist(act.checklist || []);
    setModalOpen(true);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setFormChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText("");
  };

  const handleToggleChecklist = (id: string) => {
    setFormChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const handleRemoveChecklist = (id: string) => {
    setFormChecklist((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStartDate) {
      showToast("Peringatan", "Judul kegiatan dan waktu mulai wajib diisi", "warning");
      return;
    }

    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        location: formLocation.trim() || null,
        picName: formPicName.trim() || null,
        status: formStatus,
        startDate: new Date(formStartDate).toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        checklist: formChecklist,
      };

      const url = editingActivity ? `/api/activities/${editingActivity.id}` : "/api/activities";
      const method = editingActivity ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("Gagal", "Gagal menyimpan kegiatan", "error");
        return;
      }

      showToast(
        "Berhasil",
        editingActivity ? "Kegiatan berhasil diperbarui" : "Kegiatan baru berhasil dijadwalkan",
        "success"
      );
      setModalOpen(false);
      fetchActivities();
    } catch {
      showToast("Error", "Terjadi kesalahan sistem saat menyimpan kegiatan", "error");
    }
  };

  const requestDeleteActivity = (act: ActivityItem) => {
    setActivityToDelete(act);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/activities/${activityToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        showDeleteToast(activityToDelete.title);
        fetchActivities();
      } else {
        showToast("Gagal", "Gagal menghapus kegiatan", "error");
      }
    } catch {
      showToast("Error", "Gagal menghapus kegiatan", "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setActivityToDelete(null);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calendar Navigation Helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`
    );
  };

  // Calendar Day Grid Computation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      activities: ActivityItem[];
    }[] = [];

    const todayStr = todayDateStr;

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const matched = activities.filter((act) => {
        if (!act.startDate) return false;
        const d = new Date(act.startDate);
        return (
          d.getFullYear() === prevY &&
          d.getMonth() === prevM &&
          d.getDate() === day
        );
      });

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        activities: matched,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const matched = activities.filter((act) => {
        if (!act.startDate) return false;
        const d = new Date(act.startDate);
        return (
          d.getFullYear() === currentYear &&
          d.getMonth() === currentMonth &&
          d.getDate() === day
        );
      });

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        activities: matched,
      });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const matched = activities.filter((act) => {
        if (!act.startDate) return false;
        const d = new Date(act.startDate);
        return (
          d.getFullYear() === nextY &&
          d.getMonth() === nextM &&
          d.getDate() === day
        );
      });

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        activities: matched,
      });
    }

    return cells;
  }, [currentYear, currentMonth, activities, todayDateStr]);

  // Selected Date Activities
  const selectedDateActivities = useMemo(() => {
    if (!selectedDateStr) return [];
    return activities.filter((act) => {
      if (!act.startDate) return false;
      const d = new Date(act.startDate);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      return str === selectedDateStr;
    });
  }, [selectedDateStr, activities]);

  // Selected date human readable label
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateStr) return "";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = DAY_NAMES_FULL[(dateObj.getDay() + 6) % 7];
    return `${dayOfWeek}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
  }, [selectedDateStr]);

  // Quick stats
  const totalCount = activities.length;
  const scheduledCount = activities.filter((a) => a.status === 2).length;
  const ongoingCount = activities.filter((a) => a.status === 3).length;
  const completedCount = activities.filter((a) => a.status === 4).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Activity & Event Planner
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <Sparkles className="w-3 h-3" />
              Interactive Calendar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi kalender kegiatan partai, agenda operasional, kesiapan tugas, dan integrasi anggaran (RAB).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Mode Button (shadcn/HeroUI styled segmented pill) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === "calendar"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === "list"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar List</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal(selectedDateStr)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kegiatan</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Small devices: 2 cols, Tablet/Desktop: 4 cols) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] sm:text-xs font-medium text-slate-500">Total Kegiatan</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalCount}</div>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] sm:text-xs font-medium text-blue-600">Terjadwal</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1 tabular-nums">{scheduledCount}</div>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] sm:text-xs font-medium text-amber-600">Sedang Berjalan</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1 tabular-nums">{ongoingCount}</div>
            </div>
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] sm:text-xs font-medium text-emerald-600">Selesai</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{completedCount}</div>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan, lokasi, atau PIC..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
          >
            <option value="all">Semua Status</option>
            <option value="1">Draft</option>
            <option value="2">Terjadwal</option>
            <option value="3">Berjalan</option>
            <option value="4">Selesai</option>
            <option value="5">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* View Mode 1: Interactive Calendar View */}
      {viewMode === "calendar" && (
        <div key="calendar-view" className="space-y-4 animate-fade-in">
          {loading ? (
            <SkeletonCalendar />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Calendar Controller Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Klik pada tanggal untuk melihat agenda atau jadwalkan kegiatan baru.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGoToToday}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition shadow-2xs"
                  >
                    Hari Ini
                  </button>
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                      title="Bulan sebelumnya"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-slate-200" />
                    <button
                      onClick={handleNextMonth}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                      title="Bulan berikutnya"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-bold text-slate-600 py-2.5">
                {DAY_NAMES.map((name, i) => (
                  <div key={i} className="tracking-wide">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar Days 7-Column Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/30">
                {calendarDays.map((cell, idx) => {
                  const isSelected = selectedDateStr === cell.dateStr;
                  const hasActivities = cell.activities.length > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`min-h-22.5 sm:min-h-28.75 p-1.5 sm:p-2 bg-white transition-all cursor-pointer relative group ${
                        !cell.isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "hover:bg-blue-50/20"
                      } ${
                        isSelected
                          ? "ring-2 ring-blue-500 ring-inset bg-blue-50/15 z-10"
                          : ""
                      }`}
                    >
                      {/* Top Bar of Cell: Day Number & Add Button */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center tabular-nums transition ${
                            cell.isToday
                              ? "bg-blue-600 text-white font-bold shadow-xs"
                              : isSelected
                              ? "bg-blue-100 text-blue-800 font-bold"
                              : cell.isCurrentMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {/* Quick Add Button on Hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                            handleOpenCreateModal(cell.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Tambah kegiatan di tanggal ini"
                          aria-label="Tambah kegiatan di tanggal ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Activities Inside Cell */}
                      <div className="space-y-1 overflow-hidden">
                        {cell.activities.slice(0, 2).map((act) => {
                          const config = STATUS_LABELS[act.status] || STATUS_LABELS[1];
                          const startTime = act.startDate
                            ? new Date(act.startDate).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          return (
                            <div
                              key={act.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDateStr(cell.dateStr);
                                handleOpenEditModal(act);
                              }}
                              className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded border truncate transition shadow-2xs hover:shadow-xs ${config.badgeBg} ${config.badgeText}`}
                              title={`${act.title} (${startTime})`}
                            >
                              <span className="font-normal opacity-75 mr-1">{startTime}</span>
                              <span>{act.title}</span>
                            </div>
                          );
                        })}

                        {cell.activities.length > 2 && (
                          <div className="text-[10px] font-bold text-slate-500 pl-1">
                            +{cell.activities.length - 2} kegiatan lagi
                          </div>
                        )}
                      </div>

                      {/* Dot Indicator for Mobile */}
                      {hasActivities && (
                        <div className="sm:hidden flex items-center gap-0.5 mt-1">
                          {cell.activities.slice(0, 3).map((act, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                act.status === 2
                                  ? "bg-blue-500"
                                  : act.status === 3
                                  ? "bg-amber-500"
                                  : act.status === 4
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Color Legend */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-700">Keterangan:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Terjadwal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Sedang Berjalan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Selesai</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Draft</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Dibatalkan</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400">
                  Total {activities.length} kegiatan dalam database
                </span>
              </div>
            </div>
          )}

          {/* Interactive Day Agenda Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Agenda Tanggal: <span className="text-blue-700">{selectedDateFormatted}</span>
                </h3>
              </div>
              <button
                onClick={() => handleOpenCreateModal(selectedDateStr)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Agenda di Tanggal Ini</span>
              </button>
            </div>

            {selectedDateActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada agenda kegiatan yang terjadwal pada {selectedDateFormatted}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {selectedDateActivities.map((act) => {
                  const statusConfig = STATUS_LABELS[act.status] || STATUS_LABELS[1];
                  const checklistDone = (act.checklist || []).filter((c) => c.done).length;
                  const checklistTotal = (act.checklist || []).length;
                  const hasChecklist = checklistTotal > 0;
                  const estBudget = parseFloat(act.totalEstimatedBudget) || 0;

                  return (
                    <div
                      key={act.id}
                      className="bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200 p-4 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                            >
                              {statusConfig.label}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/60 text-slate-700">
                              {act.category}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">
                            {act.title}
                          </h4>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateDisplay(act.startDate)}</span>
                            </div>
                            {act.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{act.location}</span>
                              </div>
                            )}
                            {act.picName && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>PIC: {act.picName}</span>
                              </div>
                            )}
                          </div>

                          {hasChecklist && (
                            <div className="pt-1 max-w-md">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span>Kesiapan Operasional:</span>
                                <span className="font-semibold text-slate-700">
                                  {checklistDone}/{checklistTotal} ({Math.round((checklistDone / checklistTotal) * 100)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    checklistDone === checklistTotal ? "bg-emerald-500" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-2 lg:pt-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Total Anggaran (RAB)</div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                              {formatCurrency(estBudget)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSelectBudget(act.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1"
                              title="Kelola RAB"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">RAB</span>
                            </button>
                            <button
                              onClick={() => onSelectLetter(act.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200/70 text-slate-700 hover:bg-slate-200 font-semibold text-xs flex items-center gap-1"
                              title="Buat Dokumen Surat"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Surat</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(act)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                              title="Edit kegiatan"
                              aria-label="Edit kegiatan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requestDeleteActivity(act)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus kegiatan"
                              aria-label="Hapus kegiatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode 2: Responsive Card List View */}
      {viewMode === "list" && (
        <div key="list-view" className="space-y-4 animate-fade-in">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <SkeletonActivityCard />
              <SkeletonActivityCard />
              <SkeletonActivityCard />
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 text-center rounded-xl border border-slate-200">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada kegiatan yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol &quot;Tambah Kegiatan&quot; untuk mulai merencanakan agenda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {activities.map((act) => {
                const statusConfig = STATUS_LABELS[act.status] || STATUS_LABELS[1];
                const checklistDone = (act.checklist || []).filter((c) => c.done).length;
                const checklistTotal = (act.checklist || []).length;
                const hasChecklist = checklistTotal > 0;
                const estBudget = parseFloat(act.totalEstimatedBudget) || 0;

                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-xl border border-slate-200 interactive-card p-4 sm:p-5 shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Column: Title & Meta */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                          >
                            {statusConfig.label}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {act.category}
                          </span>
                        </div>

                        <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {act.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDateDisplay(act.startDate)}</span>
                          </div>
                          {act.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{act.location}</span>
                            </div>
                          )}
                          {act.picName && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>PIC: {act.picName}</span>
                            </div>
                          )}
                        </div>

                        {/* Operational Checklist Progress Bar */}
                        {hasChecklist && (
                          <div className="pt-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>Kesiapan Operasional</span>
                              <span className="font-semibold text-slate-700">
                                {checklistDone}/{checklistTotal} Selesai ({Math.round((checklistDone / checklistTotal) * 100)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  checklistDone === checklistTotal ? "bg-emerald-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Middle Column: Budget Summary Badge */}
                      <div className="lg:text-right border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 min-w-44 flex flex-row lg:flex-col items-center lg:items-end justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-slate-400">Total Anggaran (RAB)</div>
                          <div className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                            {formatCurrency(estBudget)}
                          </div>
                        </div>
                        {parseFloat(act.totalActualBudget) > 0 && (
                          <div className="text-[10px] text-slate-500 lg:mt-0.5">
                            Realisasi:{" "}
                            <span className="tabular-nums font-semibold">
                              {formatCurrency(act.totalActualBudget)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Quick Action Links */}
                      <div className="flex flex-wrap lg:flex-col items-stretch lg:items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6">
                        <button
                          onClick={() => onSelectBudget(act.id)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition"
                          title="Kelola item anggaran kegiatan ini"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Rencana Budget</span>
                        </button>
                        <button
                          onClick={() => onSelectLetter(act.id)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition"
                          title="Buat dokumen surat resmi terikat kegiatan ini"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Buat Surat</span>
                        </button>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(act)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit kegiatan"
                            aria-label="Edit kegiatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestDeleteActivity(act)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus kegiatan"
                            aria-label="Hapus kegiatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Add / Edit Activity */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingActivity ? "Edit Rencana Kegiatan" : "Buat Rencana Kegiatan Baru"}
        description="Lengkapi detail agenda, lokasi pelaksanaan, serta daftar kesiapan operasional."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveActivity} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="cth. Workshop Pemantapan SOP Organisasi 2026"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Pelatihan">Pelatihan</option>
                <option value="Rapat">Rapat</option>
                <option value="Seminar">Seminar</option>
                <option value="Sosialisasi">Sosialisasi</option>
                <option value="Operasional">Operasional</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pelaksanaan</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={1}>Draft (Konsep)</option>
                <option value={2}>Terjadwal</option>
                <option value={3}>Sedang Berjalan</option>
                <option value={4}>Selesai</option>
                <option value={5}>Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waktu Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Selesai</label>
              <input
                type="datetime-local"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Kegiatan</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="cth. Ruang Rapat Lt. 3 / Hotel Santika"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
              <input
                type="text"
                value={formPicName}
                onChange={(e) => setFormPicName(e.target.value)}
                placeholder="cth. Budi Setiawan, S.T."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sub-item Checklist Persiapan Operasional */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Daftar Tugas Persiapan (Checklist)
            </label>
            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
              {formChecklist.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(c.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {c.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={c.done ? "line-through text-slate-400" : "text-slate-700"}>
                      {c.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    aria-label="Hapus checklist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Tambahkan tugas persiapan..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Tambah
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {editingActivity ? "Simpan Perubahan" : "Buat Kegiatan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Alert Dialog (shadcn/HeroUI style) */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setActivityToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Rencana Kegiatan"
        description={`Apakah Anda yakin ingin menghapus kegiatan "${activityToDelete?.title}"? Seluruh data anggaran RAB dan checklist tugas yang terikat juga akan ikut dihapus.`}
        confirmLabel="Hapus Kegiatan"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
