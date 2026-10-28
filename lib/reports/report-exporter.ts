import * as XLSX from "xlsx";
import type { ActivityItem } from "@/components/activities/ActivityPlanner";
import type { BudgetItemData } from "@/components/budget/BudgetPlanner";

const STATUS_LABELS: Record<number, string> = {
  1: "Draft",
  2: "Terjadwal",
  3: "Sedang Berjalan",
  4: "Selesai",
  5: "Dibatalkan",
};

/**
 * Format date for reports (e.g. 28 Okt 2026)
 */
function formatDate(isoStr?: string | null): string {
  if (!isoStr) return "-";
  try {
    return new Date(isoStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}

/**
 * Export list of activities with budget metrics to Excel (.xlsx)
 */
export function exportActivitiesToExcel(activities: ActivityItem[], filenamePrefix = "Laporan_Agenda_Kegiatan") {
  const wb = XLSX.utils.book_new();

  // Prepare rows
  const headers = [
    "No",
    "Judul Agenda Kegiatan",
    "Kategori",
    "Status",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Lokasi",
    "Penanggung Jawab (PIC)",
    "Target Pagu Estimasi (Rp)",
    "Realisasi Pengeluaran (Rp)",
    "Sisa / Efisiensi (Rp)",
    "Kesiapan Checklist (%)",
  ];

  let totalEst = 0;
  let totalAct = 0;

  const dataRows = activities.map((act, idx) => {
    const est = parseFloat(act.totalEstimatedBudget) || 0;
    const actual = parseFloat(act.totalActualBudget) || 0;
    const diff = est - actual;
    totalEst += est;
    totalAct += actual;

    const checklistTotal = act.checklist?.length || 0;
    const checklistDone = act.checklist?.filter((c) => c.done).length || 0;
    const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 100;

    return [
      idx + 1,
      act.title,
      act.category || "Umum",
      STATUS_LABELS[act.status] || "Terjadwal",
      formatDate(act.startDate),
      formatDate(act.endDate),
      act.location || "-",
      act.picName || "-",
      est,
      actual,
      diff,
      `${checklistPercent}% (${checklistDone}/${checklistTotal})`,
    ];
  });

  const totalDiff = totalEst - totalAct;

  // Title rows
  const titleRows = [
    ["LAPORAN REKAPITULASI AGENDA KEGIATAN & ANGGARAN PARTAI"],
    [`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`],
    [`Total Agenda: ${activities.length} Kegiatan`],
    [], // empty row
    headers,
  ];

  const summaryRow = [
    "",
    "TOTAL KESELURUHAN",
    "",
    "",
    "",
    "",
    "",
    "",
    totalEst,
    totalAct,
    totalDiff,
    "",
  ];

  const fullSheetData = [...titleRows, ...dataRows, [], summaryRow];

  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Column width calculations
  ws["!cols"] = [
    { wch: 5 },  // No
    { wch: 35 }, // Judul
    { wch: 15 }, // Kategori
    { wch: 16 }, // Status
    { wch: 14 }, // Tgl Mulai
    { wch: 14 }, // Tgl Selesai
    { wch: 22 }, // Lokasi
    { wch: 22 }, // PIC
    { wch: 20 }, // Pagu
    { wch: 20 }, // Realisasi
    { wch: 18 }, // Sisa
    { wch: 18 }, // Checklist
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Agenda & Anggaran");

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${todayStr}.xlsx`);
}

/**
 * Export single activity itemized budget (RAB) to Excel (.xlsx)
 */
export function exportBudgetToExcel(
  activityTitle: string,
  items: BudgetItemData[],
  summary: { totalEstimated: number; totalActual: number; variance: number }
) {
  const wb = XLSX.utils.book_new();

  const headers = [
    "No",
    "Kategori Biaya",
    "Nama Item Pengeluaran",
    "Volume",
    "Satuan",
    "Harga Satuan (Rp)",
    "Subtotal Estimasi (Rp)",
    "Realisasi Aktual (Rp)",
    "Selisih / Sisa (Rp)",
  ];

  const dataRows = items.map((item, idx) => {
    const est = parseFloat(item.estimatedSubtotal) || 0;
    const act = parseFloat(item.actualSubtotal) || 0;
    const diff = est - act;

    return [
      idx + 1,
      item.category,
      item.itemName,
      parseFloat(item.qty) || 1,
      item.unit,
      parseFloat(item.unitPrice) || 0,
      est,
      act,
      diff,
    ];
  });

  const titleRows = [
    ["RENCANA ANGGARAN BIAYA (RAB) & REALISASI PENGELUARAN"],
    [`Kegiatan: ${activityTitle}`],
    [`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`],
    [],
    headers,
  ];

  const summaryRow = [
    "",
    "TOTAL KESELURUHAN",
    "",
    "",
    "",
    "",
    summary.totalEstimated,
    summary.totalActual,
    summary.variance,
  ];

  const fullSheetData = [...titleRows, ...dataRows, [], summaryRow];

  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  ws["!cols"] = [
    { wch: 5 },  // No
    { wch: 18 }, // Kategori
    { wch: 32 }, // Nama Item
    { wch: 10 }, // Volume
    { wch: 10 }, // Satuan
    { wch: 18 }, // Harga Satuan
    { wch: 20 }, // Subtotal Estimasi
    { wch: 20 }, // Realisasi
    { wch: 18 }, // Selisih
  ];

  XLSX.utils.book_append_sheet(wb, ws, "RAB Kegiatan");

  const safeName = activityTitle.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `RAB_${safeName}_${todayStr}.xlsx`);
}

/**
 * Export all budgets recap across all activities
 */
export function exportAllBudgetsRecapToExcel(activities: ActivityItem[]) {
  exportActivitiesToExcel(activities, "Rekapitulasi_Anggaran_Seluruh_Kegiatan");
}
