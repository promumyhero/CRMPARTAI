"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Eye,
  Sparkles,
  Printer,
  Edit3,
  History,
  Save,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ActivityItem } from "@/components/activities/ActivityPlanner";
import type { BudgetItemData } from "@/components/budget/BudgetPlanner";
import type { TemplateData } from "@/components/templates/TemplateCustomizer";
import { DocumentHistory, type SavedDocument } from "./DocumentHistory";

interface DocumentGeneratorProps {
  initialActivityId?: number | null;
}

export function DocumentGenerator({ initialActivityId }: DocumentGeneratorProps) {
  const [viewMode, setViewMode] = useState<"generator" | "history">("generator");
  const [savingDoc, setSavingDoc] = useState<boolean>(false);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(initialActivityId || null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Mobile / Tablet Tab Switcher: "form" | "preview" (on lg screens both are shown side-by-side)
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");

  // Document Fields
  const [paperSize, setPaperSize] = useState<"A4" | "F4">("A4");
  const [docType, setDocType] = useState<number>(2); // 1: Undangan, 2: Permohonan Dana, 3: Surat Tugas, 4: Pemberitahuan
  const [showKop, setShowKop] = useState<boolean>(true);
  const [kopOrgName, setKopOrgName] = useState("LEMBAGA INOVASI DAN TRANSFORMASI DIGITAL");
  const [kopOrgSub, setKopOrgSub] = useState("DEWAN PENGURUS PUSAT");
  const [kopAddress, setKopAddress] = useState("Gedung Cyber Tower Lt. 12, Jl. Rasuna Said Kav. 8, Jakarta Selatan 12950");
  const [kopContact, setKopContact] = useState("(021) 555-0192 | info@crmforu.org");

  const [docNumber, setDocNumber] = useState("042/PAN-TRANS/X/2026");
  const [attachment, setAttachment] = useState("1 (Satu) Berkas");
  const [subject, setSubject] = useState("Permohonan Pencairan Anggaran Workshop Transformasi Digital");
  const [dateStr, setDateStr] = useState<string>("27 Oktober 2026");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDateStr(
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const [city, setCity] = useState("Jakarta");

  const [recipientName, setRecipientName] = useState("Kepala Bagian Keuangan & Perencanaan");
  const [recipientLocation, setRecipientLocation] = useState("Di Tempat");

  const [openingText, setOpeningText] = useState("Dengan hormat,");
  const [bodyText, setBodyText] = useState(
    "Sehubungan dengan rencana pelaksanaan kegiatan terkait, bersama ini kami sampaikan informasi dan permohonan pencairan anggaran sebagaimana tertera dalam rincian berikut:"
  );
  const [closingText, setClosingText] = useState(
    "Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasama Bapak/Ibu kami haturkan terima kasih."
  );

  const [activityTitle, setActivityTitle] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityTime, setActivityTime] = useState("08.30 WIB - Selesai");
  const [activityLocation, setActivityLocation] = useState("");
  const [includeBudgetTable, setIncludeBudgetTable] = useState<boolean>(true);

  const [signerTitle, setSignerTitle] = useState("Ketua Panitia Pelaksana,");
  const [signerName, setSignerName] = useState("Ahmad Fauzi, M.Kom");
  const [signerNip, setSignerNip] = useState("19850412 201001 1 008");

  const [budgetItems, setBudgetItems] = useState<BudgetItemData[]>([]);
  const [totalEstimatedBudget, setTotalEstimatedBudget] = useState<number>(0);

  const [exporting, setExporting] = useState<boolean>(false);
  const { showToast } = useToast();

  const applyActivityAutofill = useCallback(async (act: ActivityItem, currentDocType = docType) => {
    setSelectedActivityId(act.id);
    setActivityTitle(act.title);
    setActivityLocation(act.location || "");
    const dateFormatted = new Date(act.startDate).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setActivityDate(dateFormatted);
    if (act.picName) setSignerName(act.picName);

    if (currentDocType === 1) {
      setSubject(`Undangan Partisipasi: ${act.title}`);
      setBodyText(
        `Sehubungan dengan akan dilaksanakannya agenda ${act.title}, kami bermaksud mengundang Bapak/Ibu untuk hadir dan berpartisipasi pada kegiatan tersebut yang akan diselenggarakan pada:`
      );
      setIncludeBudgetTable(false);
    } else {
      setSubject(`Permohonan Pencairan Anggaran: ${act.title}`);
      setBodyText(
        `Sehubungan dengan rencana pelaksanaan kegiatan ${act.title}, bersama ini kami mengajukan permohonan pencairan anggaran biaya sebagaimana terinci dalam tabel berikut:`
      );
      setIncludeBudgetTable(true);
    }

    try {
      const res = await fetch(`/api/budget?activityId=${act.id}`);
      const data = (await res.json()) as { items?: BudgetItemData[]; summary?: { totalEstimated: number } };
      if (data.items) {
        setBudgetItems(data.items);
        setTotalEstimatedBudget(data.summary?.totalEstimated || 0);
      }
    } catch {
      // ignore
    }
  }, [docType]);

  // Fetch activities & templates on mount
  useEffect(() => {
    let isMounted = true;
    fetch("/api/activities")
      .then((res) => res.json())
      .then((data: { activities?: ActivityItem[] }) => {
        if (isMounted && data.activities && data.activities.length > 0) {
          setActivities(data.activities);
          const target = initialActivityId
            ? data.activities.find((a) => a.id === initialActivityId) || data.activities[0]
            : data.activities[0];
          applyActivityAutofill(target);
        }
      })
      .catch(() => {});

    fetch("/api/templates")
      .then((res) => res.json())
      .then((data: { templates?: TemplateData[] }) => {
        if (isMounted && data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialActivityId, applyActivityAutofill]);

  const handleTemplateChange = (tmplId: number) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    if (tmpl.headerOrgName) setKopOrgName(tmpl.headerOrgName);
    if (tmpl.headerOrgSub) setKopOrgSub(tmpl.headerOrgSub);
    if (tmpl.headerOrgAddress) setKopAddress(tmpl.headerOrgAddress);
    if (tmpl.headerContact) setKopContact(tmpl.headerContact);
    if (tmpl.signerTitle) setSignerTitle(tmpl.signerTitle);
    if (tmpl.signerName) setSignerName(tmpl.signerName);
    if (tmpl.signerNip) setSignerNip(tmpl.signerNip);
    if (tmpl.paperSize) setPaperSize(tmpl.paperSize as "A4" | "F4");
    if (tmpl.defaultOpening) setOpeningText(tmpl.defaultOpening);
    if (tmpl.defaultClosing) setClosingText(tmpl.defaultClosing);

    showToast("Template Diterapkan", `Pengaturan dari "${tmpl.name}" telah diterapkan.`, "info");
  };

  const handleDocTypeChange = (typeNum: number) => {
    setDocType(typeNum);
    if (typeNum === 1) {
      setSubject(`Surat Undangan Pelaksanaan ${activityTitle || "Kegiatan"}`);
      setBodyText(
        `Sehubungan dengan akan dilaksanakannya agenda ${activityTitle || "kegiatan"}, kami bermaksud mengundang Bapak/Ibu untuk berkenan hadir pada acara yang akan diselenggarakan pada:`
      );
      setIncludeBudgetTable(false);
    } else if (typeNum === 2) {
      setSubject(`Permohonan Pencairan Anggaran ${activityTitle || "Kegiatan"}`);
      setBodyText(
        `Sehubungan dengan persiapan pelaksanaan kegiatan ${activityTitle || "kegiatan"}, bersama ini kami mengajukan permohonan pencairan anggaran biaya dengan rincian kebutuhan sebagai berikut:`
      );
      setIncludeBudgetTable(true);
    } else if (typeNum === 3) {
      setSubject(`Surat Perintah Tugas Pelaksanaan ${activityTitle || "Kegiatan"}`);
      setBodyText(
        `Yang bertanda tangan di bawah ini memberikan penugasan resmi kepada nama-nama terlampir untuk melaksanakan rangkaian kegiatan:`
      );
      setIncludeBudgetTable(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setExporting(true);
      showToast("Memproses .docx", "Menyusun struktur OpenXML Microsoft Word murni...", "info");

      const payload = {
        activityId: selectedActivityId,
        paperSize,
        showKop,
        kopOrgName,
        kopOrgSub,
        kopAddress,
        kopContact,
        docNumber,
        attachment: includeBudgetTable ? "1 (Satu) Berkas Rincian RAB" : attachment,
        subject,
        dateStr,
        city,
        recipientName,
        recipientLocation,
        openingText,
        bodyText,
        closingText,
        activityTitle,
        activityDate,
        activityTime,
        activityLocation,
        includeBudgetTable,
        budgetItems,
        totalEstimatedBudget,
        signerTitle,
        signerName,
        signerNip,
      };

      const res = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || "Gagal mengunduh berkas");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeSubject = (subject || "Surat_Resmi").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${safeSubject}_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivityId,
          docNumber,
          docType,
          subject,
          recipientName,
          contentPayload: payload,
        }),
      });

      showToast(
        "Dokumen Siap!",
        "File Microsoft Word (.docx) berhasil diunduh.",
        "success"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses dokumen Word";
      showToast("Export Gagal", msg, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveDocumentOnly = async () => {
    try {
      setSavingDoc(true);
      const payload = {
        activityId: selectedActivityId,
        paperSize,
        showKop,
        kopOrgName,
        kopOrgSub,
        kopAddress,
        kopContact,
        docNumber,
        attachment: includeBudgetTable ? "1 (Satu) Berkas Rincian RAB" : attachment,
        subject,
        dateStr,
        city,
        recipientName,
        recipientLocation,
        openingText,
        bodyText,
        closingText,
        activityTitle,
        activityDate,
        activityTime,
        activityLocation,
        includeBudgetTable,
        budgetItems,
        totalEstimatedBudget,
        signerTitle,
        signerName,
        signerNip,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: selectedActivityId,
          docNumber,
          docType,
          subject,
          recipientName,
          contentPayload: payload,
          issuedDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan dokumen");
      }

      showToast("Dokumen Tersimpan!", `Surat ${docNumber} berhasil disimpan ke riwayat cloud.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan dokumen";
      showToast("Gagal Menyimpan", msg, "error");
    } finally {
      setSavingDoc(false);
    }
  };

  const handleOpenDocumentFromHistory = (doc: SavedDocument) => {
    const p = doc.contentPayload || {};
    if (doc.activityId) setSelectedActivityId(doc.activityId);
    if (doc.docNumber) setDocNumber(doc.docNumber);
    if (doc.docType) setDocType(doc.docType);
    if (doc.subject) setSubject(doc.subject);
    if (doc.recipientName) setRecipientName(doc.recipientName);
    if (p.paperSize) setPaperSize(p.paperSize);
    if (p.showKop !== undefined) setShowKop(p.showKop);
    if (p.kopOrgName) setKopOrgName(p.kopOrgName);
    if (p.kopOrgSub) setKopOrgSub(p.kopOrgSub);
    if (p.kopAddress) setKopAddress(p.kopAddress);
    if (p.kopContact) setKopContact(p.kopContact);
    if (p.attachment) setAttachment(p.attachment);
    if (p.dateStr) setDateStr(p.dateStr);
    if (p.city) setCity(p.city);
    const opening = p.openingText || p.opening;
    if (opening) setOpeningText(opening);
    if (p.bodyText) setBodyText(p.bodyText);
    const closing = p.closingText || p.closing;
    if (closing) setClosingText(closing);
    if (p.activityTitle) setActivityTitle(p.activityTitle);
    if (p.activityDate) setActivityDate(p.activityDate);
    if (p.activityTime) setActivityTime(p.activityTime);
    if (p.activityLocation) setActivityLocation(p.activityLocation);
    if (p.includeBudgetTable !== undefined) setIncludeBudgetTable(p.includeBudgetTable);
    if (p.budgetItems) setBudgetItems(p.budgetItems);
    if (p.totalEstimatedBudget) setTotalEstimatedBudget(p.totalEstimatedBudget);
    if (p.signerTitle) setSignerTitle(p.signerTitle);
    if (p.signerName) setSignerName(p.signerName);
    if (p.signerNip) setSignerNip(p.signerNip);

    setViewMode("generator");
    showToast("Dokumen Dimuat", `Dokumen "${doc.docNumber}" dimuat ke lembar kerja editor.`, "info");
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val;
    return "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation Tabs: Generator Editor vs History List */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-semibold max-w-md">
        <button
          type="button"
          onClick={() => setViewMode("generator")}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg transition ${
            viewMode === "generator" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Editor & Pratinjau Surat</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("history")}
          className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg transition ${
            viewMode === "history" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Dokumen Terbit</span>
        </button>
      </div>

      {viewMode === "history" ? (
        <DocumentHistory
          onOpenDocument={handleOpenDocumentFromHistory}
          onCreateNew={() => setViewMode("generator")}
          activities={activities}
        />
      ) : (
        <>
          {/* Top Banner & Export Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Format Surat & Export .docx
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  OpenXML
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                Autofill data kegiatan, borderless table grid untuk titik dua sejajar, dan pratinjau live A4/F4.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveDocumentOnly}
                disabled={savingDoc}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
                title="Simpan dokumen ini ke riwayat database"
              >
                <Save className="w-4 h-4 text-blue-600" />
                <span>{savingDoc ? "Menyimpan..." : "Simpan ke Riwayat"}</span>
              </button>

              <button
                onClick={handleExportDocx}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? "Menyusun Berkas..." : "Unduh Dokumen Word (.docx)"}</span>
              </button>
            </div>
          </div>

          {/* Mobile / Tablet View Switcher Toggle (Hidden on large desktop screens) */}
          <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileView("form")}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition ${
                mobileView === "form" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
              }`}
            >
              <Edit3 className="w-4 h-4" />
          <span>Pengaturan Form</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition ${
            mobileView === "preview" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Pratinjau Kertas ({paperSize})</span>
        </button>
      </div>

      {/* Main Split Grid: Form Configuration & Live Paper Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form Configuration */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileView === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Activity Connector & Template Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Penyambungan Data Kegiatan
              </span>
              <span className="text-[10px] text-slate-400">Autofill Aktif</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pilih Kegiatan Sumber:
              </label>
              <select
                value={selectedActivityId || ""}
                onChange={(e) => {
                  const act = activities.find((a) => a.id === Number(e.target.value));
                  if (act) applyActivityAutofill(act);
                }}
                className="w-full text-xs font-semibold rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jenis Surat:
                </label>
                <select
                  value={docType}
                  onChange={(e) => handleDocTypeChange(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-800"
                >
                  <option value={1}>Surat Undangan</option>
                  <option value={2}>Permohonan Dana / RAB</option>
                  <option value={3}>Surat Tugas</option>
                  <option value={4}>Surat Pemberitahuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Gunakan Template:
                </label>
                <select
                  value={selectedTemplateId || ""}
                  onChange={(e) => handleTemplateChange(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-800"
                >
                  <option value="">Standar Sistem</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Paper and Kop Settings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-600" />
                Format Cetak & Kop Surat
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPaperSize("A4")}
                  className={`px-2 py-0.5 rounded ${
                    paperSize === "A4" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize("F4")}
                  className={`px-2 py-0.5 rounded ${
                    paperSize === "F4" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  F4 (Folio)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showKop}
                onChange={(e) => setShowKop(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Tampilkan Kop Surat Resmi di Atas
            </label>

            {showKop && (
              <div className="space-y-2 pt-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nama Instansi</label>
                  <input
                    type="text"
                    value={kopOrgName}
                    onChange={(e) => setKopOrgName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Sub Judul / Divisi</label>
                  <input
                    type="text"
                    value={kopOrgSub}
                    onChange={(e) => setKopOrgSub(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Alamat & Kontak</label>
                  <input
                    type="text"
                    value={kopAddress}
                    onChange={(e) => setKopAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs mb-1"
                  />
                  <input
                    type="text"
                    value={kopContact}
                    onChange={(e) => setKopContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                    placeholder="Telp / Email"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Letter Meta & Content Fields */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h2 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
              Atribut Surat & Konten
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nomor Surat</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Lampiran</label>
                <input
                  type="text"
                  value={attachment}
                  onChange={(e) => setAttachment(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Perihal</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Kota</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Tanggal Surat</label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nama Penerima</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Tujuan / Lokasi</label>
                <input
                  type="text"
                  value={recipientLocation}
                  onChange={(e) => setRecipientLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Waktu Pelaksanaan</label>
                <input
                  type="text"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                  placeholder="08.30 WIB - Selesai"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Lokasi Agenda</label>
                <input
                  type="text"
                  value={activityLocation}
                  onChange={(e) => setActivityLocation(e.target.value)}
                  placeholder="Ruang Rapat / Hotel"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Isi / Uraian Pokok</label>
              <textarea
                rows={3}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
              />
            </div>

            {/* Checkbox Sisipkan Tabel RAB */}
            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBudgetTable}
                  onChange={(e) => setIncludeBudgetTable(e.target.checked)}
                  className="rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                />
                Sisipkan Tabel Rincian Anggaran (RAB) Otomatis
              </label>
              <p className="text-[11px] text-blue-700 mt-1 pl-5">
                Menyisipkan {budgetItems.length} baris item belanja dengan total {formatCurrency(totalEstimatedBudget)} langsung ke dalam surat.
              </p>
            </div>

            {/* Pejabat Penandatangan */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Pejabat Penandatangan
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Jabatan</label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nama Jelas</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">NIP (Opsional)</label>
                <input
                  type="text"
                  value={signerNip}
                  onChange={(e) => setSignerNip(e.target.value)}
                  placeholder="19850412 201001 1 008"
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW (KERTAS A4 / F4) */}
        <div
          className={`lg:col-span-7 flex flex-col items-center w-full ${
            mobileView === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Eye className="w-4 h-4 text-blue-600" />
              Live Preview Layar Cetak ({paperSize})
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Times New Roman • Margin Presisi
            </span>
          </div>

          {/* Paper Container Sheet with Responsive Scroll on small devices */}
          <div className="w-full overflow-x-auto pb-6">
            <div
              className={`mx-auto ${
                paperSize === "F4" ? "paper-sheet-f4" : "paper-sheet-a4"
              } rounded-lg border border-slate-200 p-6 sm:p-10 md:p-12 text-slate-900 font-document transition-all min-w-125`}
            >
              {/* 1. KOP SURAT PREVIEW */}
              {showKop && (
                <div className="text-center mb-6 border-b-2 border-slate-900 pb-3">
                  {kopOrgSub && <div className="text-xs uppercase tracking-widest text-slate-600">{kopOrgSub}</div>}
                  <div className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
                    {kopOrgName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {kopAddress} {kopContact && `| Telp: ${kopContact}`}
                  </div>
                </div>
              )}

              {/* 2. METADATA SURAT (BORDERLESS TABLE SIMULATION) */}
              <div className="grid grid-cols-12 gap-y-1 text-xs mb-6">
                <div className="col-span-2 text-slate-700">Nomor</div>
                <div className="col-span-1 text-center">:</div>
                <div className="col-span-5 font-mono text-slate-900">{docNumber}</div>
                <div className="col-span-4 text-right text-slate-700">
                  {city}, {dateStr}
                </div>

                <div className="col-span-2 text-slate-700">Lampiran</div>
                <div className="col-span-1 text-center">:</div>
                <div className="col-span-9 text-slate-800">
                  {includeBudgetTable ? "1 (Satu) Berkas Rincian RAB" : attachment}
                </div>

                <div className="col-span-2 font-bold text-slate-900">Perihal</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-9 font-bold text-slate-900">{subject}</div>
              </div>

              {/* 3. RECIPIENT */}
              <div className="text-xs space-y-1 mb-5">
                <div>Kepada Yth.</div>
                <div className="font-bold text-slate-900">{recipientName}</div>
                <div className="text-slate-600">{recipientLocation}</div>
              </div>

              {/* 4. BODY */}
              <div className="text-xs space-y-3 leading-relaxed text-justify mb-5">
                <div>{openingText}</div>
                <div>{bodyText}</div>

                {/* Activity Details Box */}
                {(activityTitle || activityDate || activityLocation) && (
                  <div className="grid grid-cols-12 gap-y-1 pl-4 py-2 my-2 bg-slate-50/50 rounded border-l-2 border-slate-300">
                    {activityTitle && (
                      <>
                        <div className="col-span-3 font-medium text-slate-700">Nama Agenda</div>
                        <div className="col-span-1 text-center">:</div>
                        <div className="col-span-8 font-bold text-slate-900">{activityTitle}</div>
                      </>
                    )}
                    {activityDate && (
                      <>
                        <div className="col-span-3 text-slate-700">Hari / Tanggal</div>
                        <div className="col-span-1 text-center">:</div>
                        <div className="col-span-8 text-slate-800">{activityDate}</div>
                      </>
                    )}
                    {activityTime && (
                      <>
                        <div className="col-span-3 text-slate-700">Waktu</div>
                        <div className="col-span-1 text-center">:</div>
                        <div className="col-span-8 text-slate-800">{activityTime}</div>
                      </>
                    )}
                    {activityLocation && (
                      <>
                        <div className="col-span-3 text-slate-700">Tempat</div>
                        <div className="col-span-1 text-center">:</div>
                        <div className="col-span-8 text-slate-800">{activityLocation}</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 5. TABEL RINCIAN RAB (JIKA DIAKTIFKAN) */}
              {includeBudgetTable && budgetItems.length > 0 && (
                <div className="my-5">
                  <div className="text-[11px] font-bold text-slate-900 mb-1.5">
                    Rincian Rencana Anggaran Biaya (RAB):
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="border border-slate-300 p-1 w-6 text-center">No</th>
                        <th className="border border-slate-300 p-1 text-left">Nama Item Pengeluaran</th>
                        <th className="border border-slate-300 p-1 text-right w-12">Vol</th>
                        <th className="border border-slate-300 p-1 text-center w-12">Satuan</th>
                        <th className="border border-slate-300 p-1 text-right w-20">Harga (Rp)</th>
                        <th className="border border-slate-300 p-1 text-right w-24">Subtotal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetItems.map((b, i) => (
                        <tr key={b.id || i} className="border-b border-slate-200">
                          <td className="border border-slate-300 p-1 text-center tabular-nums">{i + 1}</td>
                          <td className="border border-slate-300 p-1 font-medium">
                            {b.itemName} <span className="text-[9px] text-slate-500">({b.category})</span>
                          </td>
                          <td className="border border-slate-300 p-1 text-right tabular-nums">{b.qty}</td>
                          <td className="border border-slate-300 p-1 text-center">{b.unit}</td>
                          <td className="border border-slate-300 p-1 text-right tabular-nums">{formatCurrency(b.unitPrice)}</td>
                          <td className="border border-slate-300 p-1 text-right tabular-nums font-bold">
                            {formatCurrency(b.estimatedSubtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                        <td colSpan={5} className="border border-slate-300 p-1.5 text-right uppercase">
                          TOTAL ANGGARAN:
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums text-blue-800 font-bold">
                          {formatCurrency(totalEstimatedBudget)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* 6. CLOSING */}
              <div className="text-xs text-justify leading-relaxed mb-10">
                {closingText}
              </div>

              {/* 7. INVISIBLE SIGNATURE GRID */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-4">
                <div className="text-center">
                  <div>Mengetahui,</div>
                  <div className="text-slate-500 mb-16">Penanggung Jawab Kegiatan</div>
                  <div className="font-semibold text-slate-900">( ............................................ )</div>
                </div>

                <div className="text-center">
                  <div>{signerTitle || "Hormat Kami,"}</div>
                  <div className="text-slate-500 mb-16">Ketua / Pimpinan</div>
                  <div className="font-bold underline text-slate-900">{signerName}</div>
                  {signerNip && <div className="text-[10px] text-slate-600 mt-0.5">NIP. {signerNip}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
    </div>
  );
}
