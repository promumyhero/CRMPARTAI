"use client";

import React, { useState, useRef } from "react";
import { Upload, AlertTriangle, CheckCircle2, XCircle, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { parseMemberExcelBuffer, type ParseExcelResult } from "@/lib/excel/member-parser";

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberImportModal({ isOpen, onClose, onSuccess }: MemberImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = parseMemberExcelBuffer(buffer);
      setParseResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file Excel/CSV";
      setErrorMsg("Error parsing file: " + msg);
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const buffer = await droppedFile.arrayBuffer();
      const result = parseMemberExcelBuffer(buffer);
      setParseResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file Excel/CSV";
      setErrorMsg("Error parsing file: " + msg);
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    // Filter only valid & warning rows (ignore critical error rows with missing name/KTA)
    const validRows = parseResult.rows
      .filter((r) => r.status !== "error")
      .map((r) => r.data);

    if (validRows.length === 0) {
      setErrorMsg("Tidak ada baris data yang valid untuk diimpor.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: validRows }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan data anggota.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Data Anggota & Pengurus</h2>
              <p className="text-xs text-slate-500">Mendukung file Excel (.xlsx, .xls) dan CSV dengan pratinjau validasi aman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          {!parseResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-white rounded-full shadow-xs text-blue-600 border border-slate-100">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {file ? file.name : "Klik atau seret file Excel/CSV ke sini"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format file yang didukung: .xlsx, .xls, .csv (Ukuran maksimal 15MB)
                </p>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-xs hover:bg-blue-700 transition">
                Pilih Berkas Dari Komputer
              </span>
            </div>
          )}

          {isParsing && (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Menganalisis lembar kerja dan memvalidasi kolom...</p>
            </div>
          )}

          {/* Pre-Flight Preview */}
          {parseResult && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Total Baris Terbaca</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">{parseResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs text-emerald-700 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Siap
                  </span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{parseResult.validCount}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xs text-amber-700 block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Ada Peringatan
                  </span>
                  <span className="text-lg font-bold text-amber-700 font-mono">{parseResult.warningCount}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-xs text-rose-700 block flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Error / Dilewati
                  </span>
                  <span className="text-lg font-bold text-rose-700 font-mono">{parseResult.errorCount}</span>
                </div>
              </div>

              {/* Table Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pratinjau 10 Baris Pertama
                  </h3>
                  <button
                    onClick={() => {
                      setParseResult(null);
                      setFile(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Ganti Berkas Excel
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Baris</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">No. KTA</th>
                        <th className="py-2 px-3 font-semibold">Nama</th>
                        <th className="py-2 px-3 font-semibold">Jabatan</th>
                        <th className="py-2 px-3 font-semibold">Kecamatan</th>
                        <th className="py-2 px-3 font-semibold">Kelurahan</th>
                        <th className="py-2 px-3 font-semibold">Catatan Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.rows.slice(0, 15).map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 text-slate-400 font-mono">{r.rowNumber}</td>
                          <td className="py-2 px-3">
                            {r.status === "valid" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Valid
                              </span>
                            )}
                            {r.status === "warning" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Peringatan
                              </span>
                            )}
                            {r.status === "error" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                                Error
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-800">{r.data.ktaNumber || "-"}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{r.data.name || "-"}</td>
                          <td className="py-2 px-3 text-slate-600">{r.data.position || "regular"}</td>
                          <td className="py-2 px-3 text-slate-600">{r.data.district || "-"}</td>
                          <td className="py-2 px-3 text-slate-600">{r.data.subdistrict || "-"}</td>
                          <td className="py-2 px-3 text-slate-500 italic">
                            {r.issues.length > 0 ? r.issues.join("; ") : "Lengkap"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Safety Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Keamanan & Perlindungan Privasi Data:
                </p>
                <p className="text-slate-600">
                  Data diproses langsung ke database terenkripsi Anda. Sistem akan otomatis melakukan *upsert*: jika No. KTA sudah ada, data lama akan diperbarui tanpa membuat baris ganda.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition"
          >
            Batal
          </button>

          {parseResult && (
            <button
              onClick={handleConfirmImport}
              disabled={isSubmitting || parseResult.validCount + parseResult.warningCount === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan ke Supabase/Database...
                </>
              ) : (
                `Konfirmasi & Simpan (${parseResult.validCount + parseResult.warningCount} Baris)`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
