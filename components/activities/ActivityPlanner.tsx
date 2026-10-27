"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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

const STATUS_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "Draft", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
  2: { label: "Terjadwal", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  3: { label: "Berjalan", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  4: { label: "Selesai", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  5: { label: "Dibatalkan", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

interface ActivityPlannerProps {
  onSelectBudget: (activityId: number) => void;
  onSelectLetter: (activityId: number) => void;
}

export function ActivityPlanner({ onSelectBudget, onSelectLetter }: ActivityPlannerProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

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

  const { showToast } = useToast();

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
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchActivities]);

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormTitle("");
    setFormCategory("Pelatihan");
    setFormLocation("");
    setFormPicName("");
    setFormStatus(2);
    setFormStartDate(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
    setFormEndDate(new Date(Date.now() + 86400000 * 3 + 14400000).toISOString().slice(0, 16));
    setFormChecklist([
      { id: "c-1", text: "Konfirmasi kesiapan tempat & perlengkapan", done: false },
      { id: "c-2", text: "Pengajuan anggaran biaya (RAB)", done: false },
      { id: "c-3", text: "Penerbitan surat undangan peserta", done: false },
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
      showToast("Peringatan", "Judul kegiatan dan tanggal mulai wajib diisi", "error");
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
        editingActivity ? "Kegiatan berhasil diperbarui" : "Kegiatan baru berhasil dibuat",
        "success"
      );
      setModalOpen(false);
      fetchActivities();
    } catch {
      showToast("Error", "Terjadi kesalahan sistem", "error");
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus / mengarsipkan kegiatan ini?")) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Berhasil", "Kegiatan telah diarsipkan", "info");
        fetchActivities();
      }
    } catch {
      showToast("Error", "Gagal menghapus kegiatan", "error");
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

  // Quick stats
  const totalCount = activities.length;
  const scheduledCount = activities.filter((a) => a.status === 2).length;
  const ongoingCount = activities.filter((a) => a.status === 3).length;
  const completedCount = activities.filter((a) => a.status === 4).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Activity Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
            Kelola perencanaan kegiatan, kesiapan operasional tugas, dan integrasi anggaran langsung.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kegiatan Baru</span>
        </button>
      </div>

      {/* Metrics Row (Small devices: 2 cols, Tablet/Desktop: 4 cols) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] sm:text-xs font-medium text-slate-500">Total Kegiatan</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] sm:text-xs font-medium text-blue-600">Terjadwal</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1 tabular-nums">{scheduledCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] sm:text-xs font-medium text-amber-600">Sedang Berjalan</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1 tabular-nums">{ongoingCount}</div>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] sm:text-xs font-medium text-emerald-600">Selesai</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar (Mobile: stack, Tablet/Desktop: inline) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 rounded-xl border border-slate-200">
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

      {/* Activities List / Responsive Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Memuat data kegiatan...</div>
      ) : activities.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 text-center rounded-xl border border-slate-200">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Belum ada kegiatan yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol &quot;Tambah Kegiatan Baru&quot; untuk mulai merencanakan agenda.
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
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all p-4 sm:p-5 shadow-xs"
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

                  {/* Right Column: Quick Action Links (Touch-friendly for mobile/tablet) */}
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
                        onClick={() => handleDeleteActivity(act.id)}
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
    </div>
  );
}
