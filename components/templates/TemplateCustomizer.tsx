"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sliders, Plus, Edit2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface TemplateData {
  id: number;
  userId: number;
  name: string;
  docType: number;
  showKop: boolean;
  headerOrgName: string | null;
  headerOrgSub: string | null;
  headerOrgAddress: string | null;
  headerContact: string | null;
  paperSize: string;
  defaultOpening: string | null;
  defaultClosing: string | null;
  signerTitle: string | null;
  signerName: string | null;
  signerNip: string | null;
}

export function TemplateCustomizer() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [docType, setDocType] = useState(1);
  const [showKop, setShowKop] = useState(true);
  const [headerOrgName, setHeaderOrgName] = useState("");
  const [headerOrgSub, setHeaderOrgSub] = useState("");
  const [headerOrgAddress, setHeaderOrgAddress] = useState("");
  const [headerContact, setHeaderContact] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "F4">("A4");
  const [defaultOpening, setDefaultOpening] = useState("Dengan hormat,");
  const [defaultClosing, setDefaultClosing] = useState("Demikian surat ini kami sampaikan...");
  const [signerTitle, setSignerTitle] = useState("Ketua Pelaksana,");
  const [signerName, setSignerName] = useState("");
  const [signerNip, setSignerNip] = useState("");

  const { showToast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = (await res.json()) as { templates?: TemplateData[] };
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch {
      showToast("Error", "Gagal memuat daftar template", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data: { templates?: TemplateData[] }) => {
        if (isMounted && data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setName("");
    setDocType(1);
    setShowKop(true);
    setHeaderOrgName("ORGANISASI / INSTANSI RESMI");
    setHeaderOrgSub("DIVISI / LEMBAGA KERJA");
    setHeaderOrgAddress("Jl. Rasuna Said Kav. 8, Jakarta");
    setHeaderContact("(021) 555-0192");
    setPaperSize("A4");
    setDefaultOpening("Dengan hormat,");
    setDefaultClosing(
      "Demikian surat ini kami sampaikan, atas perhatian dan kerjasama Bapak/Ibu kami haturkan terima kasih."
    );
    setSignerTitle("Ketua Panitia Pelaksana,");
    setSignerName("Nama Pimpinan");
    setSignerNip("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (tmpl: TemplateData) => {
    setEditingTemplate(tmpl);
    setName(tmpl.name);
    setDocType(tmpl.docType);
    setShowKop(tmpl.showKop);
    setHeaderOrgName(tmpl.headerOrgName || "");
    setHeaderOrgSub(tmpl.headerOrgSub || "");
    setHeaderOrgAddress(tmpl.headerOrgAddress || "");
    setHeaderContact(tmpl.headerContact || "");
    setPaperSize(tmpl.paperSize === "F4" ? "F4" : "A4");
    setDefaultOpening(tmpl.defaultOpening || "Dengan hormat,");
    setDefaultClosing(tmpl.defaultClosing || "");
    setSignerTitle(tmpl.signerTitle || "");
    setSignerName(tmpl.signerName || "");
    setSignerNip(tmpl.signerNip || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Peringatan", "Nama template wajib diisi", "error");
      return;
    }

    try {
      const payload = {
        id: editingTemplate?.id,
        name: name.trim(),
        docType,
        showKop,
        headerOrgName: headerOrgName.trim() || null,
        headerOrgSub: headerOrgSub.trim() || null,
        headerOrgAddress: headerOrgAddress.trim() || null,
        headerContact: headerContact.trim() || null,
        paperSize,
        defaultOpening,
        defaultClosing,
        signerTitle,
        signerName,
        signerNip,
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("Gagal", "Gagal menyimpan template", "error");
        return;
      }

      showToast("Berhasil", "Template surat berhasil disimpan", "success");
      setModalOpen(false);
      fetchTemplates();
    } catch {
      showToast("Error", "Terjadi kesalahan sistem", "error");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Template Manager & Customizer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
            Sesuaikan kop surat dinas/organisasi, format nomor, default pejabat penandatangan, dan ukuran kertas A4/F4.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition shadow-xs shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Template Baru</span>
        </button>
      </div>

      {/* Templates Grid Cards (1 col mobile, 2 cols tablet/desktop) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Memuat daftar template...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 text-center rounded-xl border border-slate-200">
          <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Belum ada template kustom</p>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol &quot;Buat Template Baru&quot; untuk menyimpan profil kop surat organisasi Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3 sm:space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{tmpl.name}</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {tmpl.paperSize}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tmpl.headerOrgName || "Tanpa Kop Surat"}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenEditModal(tmpl)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Edit Template"
                  aria-label="Edit Template"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Template Preview Snippet */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5">
                {tmpl.headerOrgSub && (
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">
                    Sub: {tmpl.headerOrgSub}
                  </div>
                )}
                {tmpl.headerOrgAddress && (
                  <div className="text-slate-600 truncate">
                    Alamat: {tmpl.headerOrgAddress}
                  </div>
                )}
                <div className="text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span>Penandatangan: <b>{tmpl.signerName || "-"}</b></span>
                  <span className="text-slate-400">{tmpl.signerTitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Template */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTemplate ? "Edit Template Dokumen" : "Buat Template Dokumen Baru"}
        description="Atur kop instansi, struktur default, dan profil penandatangan."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Template <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Template Surat Resmi Pengurus Pusat"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran Kertas Default</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as "A4" | "F4")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="F4">F4 / Folio (215 x 330 mm)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Surat</label>
              <select
                value={docType}
                onChange={(e) => setDocType(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value={1}>Surat Undangan</option>
                <option value={2}>Permohonan Dana / Anggaran (RAB)</option>
                <option value={3}>Surat Tugas</option>
                <option value={4}>Surat Pemberitahuan</option>
              </select>
            </div>
          </div>

          {/* Kop Surat Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Pengaturan Kop Surat</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKop}
                  onChange={(e) => setShowKop(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Aktifkan Kop Surat
              </label>
            </div>

            {showKop && (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Instansi / Lembaga</label>
                  <input
                    type="text"
                    value={headerOrgName}
                    onChange={(e) => setHeaderOrgName(e.target.value)}
                    placeholder="cth. LEMBAGA INOVASI DAN TRANSFORMASI DIGITAL"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Sub Divisi / Dewan</label>
                  <input
                    type="text"
                    value={headerOrgSub}
                    onChange={(e) => setHeaderOrgSub(e.target.value)}
                    placeholder="cth. DEWAN PENGURUS PUSAT"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={headerOrgAddress}
                    onChange={(e) => setHeaderOrgAddress(e.target.value)}
                    placeholder="cth. Gedung Cyber Tower Lt. 12, Jl. Rasuna Said Kav. 8, Jakarta"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Kontak / Email / Telepon</label>
                  <input
                    type="text"
                    value={headerContact}
                    onChange={(e) => setHeaderContact(e.target.value)}
                    placeholder="cth. (021) 555-0192 | info@crmforu.org"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Signer */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Profil Penandatangan Default</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Jabatan</label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="cth. Ketua Panitia Pelaksana,"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Pejabat</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="cth. Dr. Hendra Gunawan, S.T., M.Sc."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIP (Opsional)</label>
              <input
                type="text"
                value={signerNip}
                onChange={(e) => setSignerNip(e.target.value)}
                placeholder="cth. 19780820 200312 1 002"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
              />
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
              Simpan Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
