"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Calendar,
  Building,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ActivityItem } from "@/components/activities/ActivityPlanner";
import type { BudgetItemData } from "@/components/budget/BudgetPlanner";

export interface DocumentContentPayload {
  activityId?: number | null;
  paperSize?: "A4" | "F4";
  showKop?: boolean;
  kopOrgName?: string;
  kopOrgSub?: string;
  kopAddress?: string;
  kopContact?: string;
  docNumber?: string;
  attachment?: string;
  subject?: string;
  dateStr?: string;
  city?: string;
  recipientName?: string;
  recipientLocation?: string;
  openingText?: string;
  opening?: string;
  bodyText?: string;
  closingText?: string;
  closing?: string;
  activityTitle?: string;
  activityDate?: string;
  activityTime?: string;
  activityLocation?: string;
  includeBudgetTable?: boolean;
  budgetItems?: BudgetItemData[];
  totalEstimatedBudget?: number;
  signerTitle?: string;
  signerName?: string;
  signerNip?: string;
}

export interface SavedDocument {
  id: number;
  activityId?: number | null;
  userId: number;
  docNumber: string;
  docType: number;
  subject: string;
  recipientName: string;
  contentPayload: DocumentContentPayload;
  issuedDate: string;
  createdAt: string;
}

interface DocumentHistoryProps {
  onOpenDocument: (doc: SavedDocument) => void;
  onCreateNew: () => void;
  activities?: ActivityItem[];
}

export function DocumentHistory({
  onOpenDocument,
  onCreateNew,
  activities = [],
}: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<number | "all">("all");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDocToDelete, setSelectedDocToDelete] = useState<SavedDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const fetchDocuments = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setLoading(true);
        }
        const res = await fetch("/api/documents");
        if (!res.ok) throw new Error("Gagal mengambil data dokumen");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        showToast("Gagal Memuat Dokumen", msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    let ignore = false;
    fetch("/api/documents")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data dokumen");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setDocuments(data.documents || []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
          showToast("Gagal Memuat Dokumen", msg, "error");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showToast]);

  const activityMap = useMemo(() => {
    const map = new Map<number, string>();
    activities.forEach((act) => map.set(act.id, act.title));
    return map;
  }, [activities]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.docNumber.toLowerCase().includes(search.toLowerCase()) ||
        doc.subject.toLowerCase().includes(search.toLowerCase()) ||
        doc.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        (doc.activityId && activityMap.get(doc.activityId)?.toLowerCase().includes(search.toLowerCase()));

      const matchesType = filterType === "all" || doc.docType === filterType;
      return matchesSearch && matchesType;
    });
  }, [documents, search, filterType, activityMap]);

  const handleDownloadDocx = async (doc: SavedDocument) => {
    try {
      setDownloadingId(doc.id);
      showToast("Menyiapkan Berkas", `Mengunduh ${doc.docNumber}...`, "info");

      const payload = doc.contentPayload || {};
      const res = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          docNumber: doc.docNumber,
          subject: doc.subject,
          recipientName: doc.recipientName,
          activityId: doc.activityId || payload.activityId,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengunduh dokumen dari server");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeSubject = (doc.subject || "Surat_Resmi").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${safeSubject}_${doc.docNumber.replace(/[^a-zA-Z0-9_-]/g, "-")}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("Berhasil Diunduh", `File ${doc.docNumber}.docx siap dibuka.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh dokumen";
      showToast("Download Gagal", msg, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (doc: SavedDocument) => {
    setSelectedDocToDelete(doc);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/documents/${selectedDocToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus dokumen");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== selectedDocToDelete.id));
      showToast(
        "Dokumen Dihapus",
        `Dokumen "${selectedDocToDelete.docNumber}" berhasil dihapus dari riwayat.`,
        "success"
      );
      setDeleteConfirmOpen(false);
      setSelectedDocToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus";
      showToast("Penghapusan Gagal", msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getDocTypeBadge = (type: number) => {
    switch (type) {
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Surat Undangan
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Permohonan Dana / RAB
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Surat Tugas
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Surat Pemberitahuan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Surat Resmi
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Riwayat Dokumen & Surat Terbit</span>
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {documents.length} Berkas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh surat dinas, permohonan anggaran, dan surat tugas yang tersimpan di Supabase Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDocuments(true)}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={onCreateNew}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Surat Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor surat, perihal, nama penerima, atau kegiatan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({documents.length})
          </button>
          <button
            onClick={() => setFilterType(2)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 2
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Permohonan Dana
          </button>
          <button
            onClick={() => setFilterType(1)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 1
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Undangan
          </button>
          <button
            onClick={() => setFilterType(3)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              filterType === 3
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Surat Tugas
          </button>
        </div>
      </div>

      {/* Document List View */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <p className="text-xs font-medium">Memuat riwayat dokumen dari cloud database...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-800">
              {search || filterType !== "all"
                ? "Tidak ada dokumen yang cocok dengan filter"
                : "Belum Ada Riwayat Dokumen yang Dibuat"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {search || filterType !== "all"
                ? "Coba gunakan kata kunci pencarian lain atau pilih kategori surat yang berbeda."
                : "Saat Anda membuat dan mengunduh surat resmi atau permohonan anggaran, salinan dokumen akan otomatis tercatat di sini."}
            </p>
          </div>
          {(!search && filterType === "all") && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Dokumen Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredDocs.map((doc) => {
            const actTitle = doc.activityId ? activityMap.get(doc.activityId) : null;
            const hasRab = Boolean(doc.contentPayload?.includeBudgetTable && (doc.contentPayload?.budgetItems?.length ?? 0) > 0);
            const totalRAB = doc.contentPayload?.totalEstimatedBudget || 0;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex flex-col justify-between group relative"
              >
                <div className="space-y-2.5">
                  {/* Top Badge & Date */}
                  <div className="flex items-center justify-between gap-2">
                    {getDocTypeBadge(doc.docType)}
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {doc.issuedDate || new Date(doc.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  {/* Doc Number & Subject */}
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-800 tracking-tight line-clamp-1">
                      {doc.docNumber}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                      {doc.subject}
                    </h3>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400">Kepada:</span>
                      <span className="font-medium text-slate-700 truncate">{doc.recipientName}</span>
                    </div>

                    {actTitle && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-slate-400">Kegiatan:</span>
                        <span className="font-medium text-blue-700 truncate">{actTitle}</span>
                      </div>
                    )}

                    {hasRab && (
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-semibold">
                          Lampiran RAB: Rp {Number(totalRAB).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => onOpenDocument(doc)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    title="Buka kembali dokumen ini di editor"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Muat ke Editor</span>
                  </button>

                  <button
                    onClick={() => handleDownloadDocx(doc)}
                    disabled={downloadingId === doc.id}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    title="Unduh kembali file Word .docx"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">.docx</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClick(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Hapus riwayat dokumen ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Hapus Dokumen dari Riwayat?"
        description={
          selectedDocToDelete
            ? `Dokumen "${selectedDocToDelete.docNumber}" (${selectedDocToDelete.subject}) akan dihapus secara permanen dari Supabase Cloud.`
            : "Apakah Anda yakin ingin menghapus dokumen ini?"
        }
        confirmLabel="Ya, Hapus Dokumen"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false);
            setSelectedDocToDelete(null);
          }
        }}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
