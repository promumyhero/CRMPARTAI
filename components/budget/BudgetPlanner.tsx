"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  FolderOpen,
  DollarSign,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCard, SkeletonRow } from "@/components/ui/Skeleton";
import type { ActivityItem } from "@/components/activities/ActivityPlanner";

export interface BudgetItemData {
  id: number;
  activityId: number;
  category: string;
  itemName: string;
  qty: string;
  unit: string;
  unitPrice: string;
  estimatedSubtotal: string;
  actualSubtotal: string;
  createdAt: string;
}

interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  variance: number;
  isDeficit: boolean;
}

interface AutofillSuggestion {
  id: number;
  valueText: string;
  metadata?: {
    lastUnit?: string;
    lastPrice?: number;
    category?: string;
  };
}

interface BudgetPlannerProps {
  initialActivityId?: number | null;
  onSelectLetter: (activityId: number) => void;
}

const CATEGORIES = [
  "Konsumsi",
  "Perlengkapan",
  "Transportasi",
  "Akomodasi",
  "Dokumentasi & Publikasi",
  "Honorarium",
  "Administrasi & Kesekretariatan",
  "Lain-lain",
];

export function BudgetPlanner({ initialActivityId, onSelectLetter }: BudgetPlannerProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(initialActivityId || null);
  const [budgetItems, setBudgetItems] = useState<BudgetItemData[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    totalEstimated: 0,
    totalActual: 0,
    variance: 0,
    isDeficit: false,
  });
  const [loading, setLoading] = useState(false);

  // Modal Item State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItemData | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState("Konsumsi");
  const [formItemName, setFormItemName] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formUnit, setFormUnit] = useState("Box");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formActualSubtotal, setFormActualSubtotal] = useState("0");

  // Autofill Suggestions State
  const [suggestions, setSuggestions] = useState<AutofillSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { showToast, showDeleteToast } = useToast();

  // Delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BudgetItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load activities list for dropdown
  useEffect(() => {
    let isMounted = true;
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data: { activities?: ActivityItem[] }) => {
        if (isMounted && data.activities && data.activities.length > 0) {
          setActivities(data.activities);
          if (!selectedActivityId) {
            setSelectedActivityId(data.activities[0].id);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedActivityId]);

  // Synchronize state from prop if changed
  const [prevInitialId, setPrevInitialId] = useState(initialActivityId);
  if (initialActivityId !== prevInitialId) {
    setPrevInitialId(initialActivityId);
    if (initialActivityId) setSelectedActivityId(initialActivityId);
  }

  // Load budget items when activity changes
  const fetchBudget = useCallback(async (actId: number) => {
    try {
      const res = await fetch(`/api/budget?activityId=${actId}`);
      const data = (await res.json()) as { items?: BudgetItemData[]; summary?: BudgetSummary };
      if (data.items && data.summary) {
        setBudgetItems(data.items);
        setSummary(data.summary);
      }
    } catch {
      showToast("Error", "Gagal memuat item anggaran", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!selectedActivityId) return;
    let isMounted = true;
    fetch(`/api/budget?activityId=${selectedActivityId}`)
      .then((res) => res.json())
      .then((data: { items?: BudgetItemData[]; summary?: BudgetSummary }) => {
        if (isMounted && data.items && data.summary) {
          setBudgetItems(data.items);
          setSummary(data.summary);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedActivityId]);

  // Debounced Autofill fetch
  const handleItemNameChange = (val: string) => {
    setFormItemName(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autofill?type=budget_item&q=${encodeURIComponent(val)}`);
        const data = (await res.json()) as { suggestions?: AutofillSuggestion[] };
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 200);
  };

  const handleSelectSuggestion = (sug: AutofillSuggestion) => {
    setFormItemName(sug.valueText);
    if (sug.metadata) {
      if (sug.metadata.lastUnit) setFormUnit(sug.metadata.lastUnit);
      if (sug.metadata.lastPrice) setFormUnitPrice(String(sug.metadata.lastPrice));
      if (sug.metadata.category) setFormCategory(sug.metadata.category);
    }
    setShowSuggestions(false);
    showToast("Autofill Berhasil", `Satuan & estimasi harga terisi otomatis: ${sug.valueText}`, "info");
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCategory("Konsumsi");
    setFormItemName("");
    setFormQty("1");
    setFormUnit("Box");
    setFormUnitPrice("");
    setFormActualSubtotal("0");
    setShowSuggestions(false);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: BudgetItemData) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormItemName(item.itemName);
    setFormQty(item.qty);
    setFormUnit(item.unit);
    setFormUnitPrice(item.unitPrice);
    setFormActualSubtotal(item.actualSubtotal);
    setShowSuggestions(false);
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) {
      showToast("Peringatan", "Pilih kegiatan terlebih dahulu", "error");
      return;
    }
    if (!formItemName.trim() || !formUnitPrice) {
      showToast("Peringatan", "Nama item dan harga satuan wajib diisi", "error");
      return;
    }

    try {
      const payload = {
        activityId: selectedActivityId,
        category: formCategory,
        itemName: formItemName.trim(),
        qty: parseFloat(formQty) || 1,
        unit: formUnit.trim(),
        unitPrice: parseFloat(formUnitPrice) || 0,
        actualSubtotal: parseFloat(formActualSubtotal) || 0,
      };

      const url = editingItem ? `/api/budget/${editingItem.id}` : "/api/budget";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("Gagal", "Gagal menyimpan item anggaran", "error");
        return;
      }

      showToast("Berhasil", editingItem ? "Item diperbarui" : "Item berhasil ditambahkan", "success");
      setModalOpen(false);
      fetchBudget(selectedActivityId);
    } catch {
      showToast("Error", "Terjadi kesalahan sistem", "error");
    }
  };

  const requestDeleteItem = (item: BudgetItemData) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/budget/${itemToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        showDeleteToast(itemToDelete.itemName);
        if (selectedActivityId) fetchBudget(selectedActivityId);
      } else {
        showToast("Gagal", "Gagal menghapus item dari anggaran", "error");
      }
    } catch {
      showToast("Error", "Gagal menghapus item anggaran", "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  const groupedItems = budgetItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItemData[]>);

  const subtotalEstimatePreview = (parseFloat(formQty) || 0) * (parseFloat(formUnitPrice) || 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Controller: Select Activity & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Budget Planning (RAB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
            Kalkulasi anggaran presisi, perbandingan estimasi vs realisasi, dan autofill referensi cepat.
          </p>
        </div>

        {/* Activity Selector & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kegiatan Terpilih:
            </label>
            <select
              value={selectedActivityId || ""}
              onChange={(e) => setSelectedActivityId(Number(e.target.value))}
              className="text-xs font-semibold rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full sm:min-w-56"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 mt-auto rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item RAB</span>
          </button>
        </div>
      </div>

      {/* SUMMARY BAR (Real-Time Calculation without page reload) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Total Estimasi (Pagu) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Estimasi (Pagu)
                </span>
                <span className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Calculator className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                {formatCurrency(summary.totalEstimated)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Akumulasi estimasi seluruh kebutuhan</p>
            </div>

            {/* Total Realisasi / Aktual */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Realisasi (Aktual)
                </span>
                <span className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                {formatCurrency(summary.totalActual)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Pengeluaran aktual yang terverifikasi</p>
            </div>

            {/* Selisih (Surplus / Defisit) */}
            <div
              className={`p-4 sm:p-5 rounded-xl border shadow-xs sm:col-span-2 md:col-span-1 ${
                summary.isDeficit
                  ? "bg-rose-50/50 border-rose-200"
                  : summary.totalActual > 0
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider ${
                    summary.isDeficit ? "text-rose-700" : "text-slate-500"
                  }`}
                >
                  {summary.isDeficit ? "Defisit Anggaran" : "Sisa Pagu / Surplus"}
                </span>
                <span
                  className={`p-1.5 sm:p-2 rounded-lg ${
                    summary.isDeficit
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {summary.isDeficit ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                </span>
              </div>
              <div
                className={`text-xl sm:text-2xl font-bold mt-2 tabular-nums ${
                  summary.isDeficit ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {formatCurrency(Math.abs(summary.variance))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.isDeficit
                  ? "Realisasi melebihi estimasi awal"
                  : "Anggaran dalam batas pagu yang aman"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Itemized Budget Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Rincian Item Anggaran Biaya (RAB)
            </h2>
            <p className="text-xs text-slate-500">
              Kegiatan: <span className="font-semibold text-slate-800">{selectedActivity?.title || "-"}</span>
            </p>
          </div>

          {selectedActivityId && (
            <button
              onClick={() => onSelectLetter(selectedActivityId)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
            >
              <span>Sisipkan ke Format Surat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-162.5">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 sm:px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 sm:px-4">Nama Item Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Harga Satuan (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Total Estimasi (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Realisasi (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <SkeletonRow cols={8} />
                <SkeletonRow cols={8} />
                <SkeletonRow cols={8} />
                <SkeletonRow cols={8} />
              </tbody>
            </table>
          </div>
        ) : budgetItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Belum ada item anggaran</p>
            <p className="text-xs text-slate-400 mt-1">
              Tambahkan item pengeluaran seperti konsumsi, sewa venue, atau perlengkapan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-162.5">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 sm:px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 sm:px-4">Nama Item Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Harga Satuan (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Total Estimasi (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">Realisasi (Rp)</th>
                  <th className="py-2.5 px-3 sm:px-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={8} className="py-2 px-3 sm:px-4 uppercase text-[10px] tracking-wider text-blue-700">
                        • Kategori: {category} ({items.length} item)
                      </td>
                    </tr>

                    {items.map((item, idx) => {
                      const estSub = parseFloat(item.estimatedSubtotal) || 0;
                      const actSub = parseFloat(item.actualSubtotal) || 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 sm:px-4 text-center text-slate-400 tabular-nums font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 sm:px-4 font-semibold text-slate-900">
                            {item.itemName}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                            {parseFloat(item.qty).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-right tabular-nums text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-right tabular-nums font-bold text-slate-900">
                            {formatCurrency(estSub)}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-right tabular-nums font-semibold text-slate-700">
                            {actSub > 0 ? (
                              formatCurrency(actSub)
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 sm:px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="Edit Item"
                                aria-label="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => requestDeleteItem(item)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus Item"
                                aria-label="Hapus Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={5} className="py-3 px-3 sm:px-4 text-right uppercase text-xs">
                    Total Anggaran Keseluruhan:
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-xs sm:text-sm text-blue-700">
                    {formatCurrency(summary.totalEstimated)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right tabular-nums text-xs sm:text-sm text-slate-900">
                    {formatCurrency(summary.totalActual)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Budget Item */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Baris Anggaran" : "Tambah Item Pengeluaran RAB"}
        description="Lengkapi kuantitas, satuan, serta harga estimasi untuk kalkulasi otomatis."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Pengeluaran
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Item Name with Reusable Autofill Popup */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Item <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Smart Autofill
              </span>
            </div>
            <input
              type="text"
              required
              value={formItemName}
              onChange={(e) => handleItemNameChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="cth. Snack Box & Kopi Pagi Peserta"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                <div className="p-2 text-[10px] font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
                  Item yang pernah dibuat sebelumnya:
                </div>
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition border-b border-slate-100 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{sug.valueText}</span>
                      {sug.metadata?.category && (
                        <span className="text-[10px] text-slate-500 ml-1.5">({sug.metadata.category})</span>
                      )}
                    </div>
                    {sug.metadata?.lastPrice && (
                      <span className="text-[11px] font-mono text-blue-700">
                        {formatCurrency(sug.metadata.lastPrice)} / {sug.metadata.lastUnit || "unit"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Qty & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volume / Kuantitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="cth. Box, Orang, Paket"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Price & Subtotal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Satuan Estimasi (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={formUnitPrice}
                onChange={(e) => setFormUnitPrice(e.target.value)}
                placeholder="25000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Realisasi / SPJ (Rp)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formActualSubtotal}
                onChange={(e) => setFormActualSubtotal(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </div>
          </div>

          {/* Calculated Subtotal Display */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Subtotal Estimasi:</span>
            <span className="text-sm font-bold text-blue-700 tabular-nums">
              {formatCurrency(subtotalEstimatePreview)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              {editingItem ? "Simpan Perubahan" : "Tambahkan ke RAB"}
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
            setItemToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Item Anggaran"
        description={`Apakah Anda yakin ingin menghapus item "${itemToDelete?.itemName}" senilai ${formatCurrency(itemToDelete?.estimatedSubtotal || 0)}? Data ini akan dihapus dari anggaran kegiatan.`}
        confirmLabel="Hapus Item"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
