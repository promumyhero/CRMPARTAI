"use client";

import React, { useRef } from "react";
import { Printer, FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { ActivityItem } from "@/components/activities/ActivityPlanner";
import type { BudgetItemData } from "@/components/budget/BudgetPlanner";
import { exportActivitiesToExcel, exportBudgetToExcel } from "@/lib/reports/report-exporter";

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "activities" | "budget";
  activities?: ActivityItem[];
  selectedActivity?: ActivityItem | null;
  budgetItems?: BudgetItemData[];
  budgetSummary?: {
    totalEstimated: number;
    totalActual: number;
    variance: number;
    isDeficit: boolean;
  };
}

export function PrintReportModal({
  isOpen,
  onClose,
  reportType,
  activities = [],
  selectedActivity,
  budgetItems = [],
  budgetSummary = { totalEstimated: 0, totalActual: 0, variance: 0, isDeficit: false },
}: PrintReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (reportType === "activities") {
      exportActivitiesToExcel(activities);
    } else if (selectedActivity) {
      exportBudgetToExcel(selectedActivity.title, budgetItems, budgetSummary);
    }
  };

  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau & Cetak Laporan Resmi"
      description="Laporan berformat resmi siap cetak ke printer fisik atau simpan sebagai dokumen PDF."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {reportType === "activities" ? "Laporan Agenda Kegiatan" : "Laporan Rencana Anggaran (RAB)"}
            </span>
            <span className="text-xs text-slate-500">
              {reportType === "activities" ? `${activities.length} Kegiatan` : `${budgetItems.length} Item Anggaran`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Unduh format spreadsheet .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Cetak atau simpan ke PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div
          ref={printAreaRef}
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs text-slate-900 text-xs space-y-6 printable-report"
        >
          {/* Header Kop Resmi */}
          <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wider text-slate-900">
              DEWAN PENGURUS DAERAH / PUSAT PARTAI
            </h2>
            <h3 className="text-xs sm:text-sm font-bold text-blue-800 uppercase tracking-wide">
              {reportType === "activities"
                ? "LAPORAN REKAPITULASI AGENDA OPERASIONAL & KEGIATAN"
                : "LAPORAN PERTANGGUNGJAWABAN RENCANA ANGGARAN BIAYA (RAB)"}
            </h3>
            <p className="text-[10px] text-slate-500">
              Sistem Informasi Manajemen Kader & Tata Kelola Kepengurusan (CRM Partai)
            </p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 py-1 border-b border-slate-100">
            <div>
              <span>Tanggal Cetak: </span>
              <strong className="text-slate-800">{printDate}</strong>
            </div>
            {reportType === "budget" && selectedActivity && (
              <div>
                <span>Agenda: </span>
                <strong className="text-blue-800">{selectedActivity.title}</strong>
              </div>
            )}
            <div>
              <span>Status Dokumen: </span>
              <span className="font-semibold text-emerald-700">Terverifikasi Sistem</span>
            </div>
          </div>

          {/* Table Data */}
          {reportType === "activities" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-2 text-center w-8">No</th>
                    <th className="py-2 px-3">Agenda Kegiatan</th>
                    <th className="py-2 px-2">Kategori</th>
                    <th className="py-2 px-2">Waktu</th>
                    <th className="py-2 px-2">Lokasi</th>
                    <th className="py-2 px-2 text-right">Pagu Estimasi</th>
                    <th className="py-2 px-2 text-right">Realisasi SPJ</th>
                    <th className="py-2 px-2 text-right">Sisa Dana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activities.map((act, idx) => {
                    const est = parseFloat(act.totalEstimatedBudget) || 0;
                    const real = parseFloat(act.totalActualBudget) || 0;
                    const diff = est - real;

                    return (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{act.title}</td>
                        <td className="py-2 px-2 text-slate-600">{act.category}</td>
                        <td className="py-2 px-2 text-slate-600 whitespace-nowrap">
                          {new Date(act.startDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{act.location || "-"}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-800">
                          {formatCurrency(est)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-800">
                          {formatCurrency(real)}
                        </td>
                        <td className={`py-2 px-2 text-right font-mono tabular-nums font-semibold ${diff < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          {formatCurrency(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                    <td colSpan={5} className="py-2.5 px-3 text-right uppercase text-[10px]">
                      Total Akumulasi:
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-blue-800">
                      {formatCurrency(
                        activities.reduce((acc, a) => acc + (parseFloat(a.totalEstimatedBudget) || 0), 0)
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                      {formatCurrency(
                        activities.reduce((acc, a) => acc + (parseFloat(a.totalActualBudget) || 0), 0)
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-800">
                      {formatCurrency(
                        activities.reduce(
                          (acc, a) =>
                            acc +
                            ((parseFloat(a.totalEstimatedBudget) || 0) - (parseFloat(a.totalActualBudget) || 0)),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-2 text-center w-8">No</th>
                    <th className="py-2 px-2">Kategori</th>
                    <th className="py-2 px-3">Item Pengeluaran</th>
                    <th className="py-2 px-2 text-right">Volume</th>
                    <th className="py-2 px-2 text-center">Satuan</th>
                    <th className="py-2 px-2 text-right">Harga Satuan</th>
                    <th className="py-2 px-2 text-right">Subtotal Estimasi</th>
                    <th className="py-2 px-2 text-right">Realisasi SPJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {budgetItems.map((item, idx) => {
                    const est = parseFloat(item.estimatedSubtotal) || 0;
                    const real = parseFloat(item.actualSubtotal) || 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2 text-slate-600">{item.category}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{item.itemName}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">{item.qty}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.unit}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(est)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-800">
                          {real > 0 ? formatCurrency(real) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                    <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[10px]">
                      Total Keseluruhan:
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-blue-800">
                      {formatCurrency(budgetSummary.totalEstimated)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                      {formatCurrency(budgetSummary.totalActual)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Signature Block for Formal Party Submissions */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-16">
              <p className="text-slate-600">Mengetahui / Penanggung Jawab,</p>
              <div>
                <p className="font-bold underline text-slate-900">
                  {selectedActivity?.picName || "Ketua Pelaksana / Panitia"}
                </p>
                <p className="text-[10px] text-slate-500">PIC Agenda Operasional</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="text-slate-600">Verifikator / Keuangan,</p>
              <div>
                <p className="font-bold underline text-slate-900">Bendahara Kepengurusan</p>
                <p className="text-[10px] text-slate-500">Bagian Perencanaan & Anggaran</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
