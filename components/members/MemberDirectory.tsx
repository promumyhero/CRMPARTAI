"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Upload,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Trash2,
  RefreshCw,
  Award,
} from "lucide-react";
import type { PartyMember } from "@/lib/db/schema";
import { MemberImportModal } from "./MemberImportModal";

interface StatsData {
  totalMembers: number;
  totalMale: number;
  totalFemale: number;
  femalePercentage: number;
  totalOfficials: number;
  totalRegular: number;
  totalVerified: number;
  districts: Record<string, number>;
}

export function MemberDirectory() {
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [position, setPosition] = useState("");
  const [gender, setGender] = useState("");
  const [unmaskSensitive, setUnmaskSensitive] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch members and stats
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (district) params.set("district", district);
      if (position) params.set("position", position);
      if (gender) params.set("gender", gender);
      params.set("limit", "100");

      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Gagal memuat data anggota:", err);
    } finally {
      setLoading(false);
    }
  }, [search, district, position, gender]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  // Mask NIK: e.g. 6171025312800007 -> 617102********07
  const maskNik = (nik: string | null | undefined) => {
    if (!nik) return "-";
    if (unmaskSensitive) return nik;
    if (nik.length < 10) return "******";
    return nik.substring(0, 6) + "********" + nik.substring(nik.length - 2);
  };

  // Mask Phone: e.g. 081350784146 -> 0813****4146
  const maskPhone = (phone: string | null | undefined) => {
    if (!phone) return "-";
    if (unmaskSensitive) return phone;
    if (phone.length < 8) return "08****";
    return phone.substring(0, 4) + "****" + phone.substring(phone.length - 4);
  };

  // Calculate age from birthDate
  const getAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return "-";
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? "-" : `${age} thn`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data anggota ini?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        fetchMembers();
      }
    } catch (err) {
      console.error("Gagal menghapus:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Position badge styling
  const getPositionBadge = (pos: string) => {
    const p = pos.toLowerCase();
    if (p.includes("ketua") || p.includes("sekretaris") || p.includes("bendahara") || p.includes("pembina")) {
      return "bg-blue-100 text-blue-800 border-blue-200 font-bold";
    }
    if (p.includes("saksi") || p.includes("pemenangan") || p.includes("bappilu")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold";
    }
    if (p.includes("koordinator") || p.includes("biro") || p.includes("bidang")) {
      return "bg-purple-100 text-purple-800 border-purple-200 font-medium";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Anggota */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Kader Terdata</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalMembers}</span>
              <span className="text-xs text-slate-500">anggota</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.totalMale} Laki-laki • {stats.totalFemale} Perempuan
            </p>
          </div>

          {/* Card 2: Keterwakilan Perempuan (30% KPU Quota) */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Kuota Perempuan (KPU)</span>
              {stats.femalePercentage >= 30 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Memenuhi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <ShieldAlert className="w-3 h-3" /> &lt; 30%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.femalePercentage}%</span>
              <span className="text-xs text-slate-500">kader wanita</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${stats.femalePercentage >= 30 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(stats.femalePercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Struktur Pengurus vs Regular */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Pengurus Struktural</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalOfficials}</span>
              <span className="text-xs text-slate-500">pejabat / PIC</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.totalRegular} anggota regular di basis
            </p>
          </div>

          {/* Card 4: Kesiapan Verifikasi */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Status Verifikasi Organisasi</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600 font-mono">{stats.totalVerified}</span>
              <span className="text-xs text-slate-500">kader tervalidasi</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Siap verifikasi SIPOL KPU
            </p>
          </div>
        </div>
      )}

      {/* 2. Control Bar (Search, Filters, Data Masking & Import Button) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, No. KTA, atau NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Kecamatan */}
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-700"
          >
            <option value="">Semua Kecamatan</option>
            <option value="Pontianak Barat">Pontianak Barat</option>
            <option value="Pontianak Kota">Pontianak Kota</option>
            <option value="Pontianak Selatan">Pontianak Selatan</option>
            <option value="Pontianak Tenggara">Pontianak Tenggara</option>
            <option value="Pontianak Timur">Pontianak Timur</option>
            <option value="Pontianak Utara">Pontianak Utara</option>
          </select>

          {/* Jabatan */}
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-700"
          >
            <option value="">Semua Jabatan</option>
            <option value="Ketua">Ketua</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Wakil Ketua">Wakil Ketua</option>
            <option value="Wakil Sekretaris">Wakil Sekretaris</option>
            <option value="Wakil Bendahara">Wakil Bendahara</option>
            <option value="regular">Regular</option>
          </select>

          {/* Gender */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-700"
          >
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          {/* Toggle Masking */}
          <button
            onClick={() => setUnmaskSensitive(!unmaskSensitive)}
            title={unmaskSensitive ? "Sembunyikan NIK & No HP" : "Buka sensor data NIK & No HP"}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition ${
              unmaskSensitive
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {unmaskSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{unmaskSensitive ? "Sensor NIK" : "Buka Sensor NIK"}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Table of Members */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">No. KTA & Nama</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Gender & Usia</th>
                <th className="py-3 px-4">Wilayah</th>
                <th className="py-3 px-4">Kontak (WA)</th>
                <th className="py-3 px-4">Status Organisasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Memuat data direktori kader...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Belum ada data anggota.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Gunakan tombol <strong>&ldquo;Import Excel / CSV&rdquo;</strong> di atas untuk memasukkan data kader.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* No KTA & Nama */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{m.ktaNumber}</div>
                    </td>

                    {/* Jabatan */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getPositionBadge(m.position)}`}>
                        {m.position || "regular"}
                      </span>
                    </td>

                    {/* NIK */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {maskNik(m.nik)}
                    </td>

                    {/* Gender & Usia */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{m.gender || "-"}</div>
                      <div className="text-[10px] text-slate-400">{getAge(m.birthDate)}</div>
                    </td>

                    {/* Wilayah */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.district || "-"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4">{m.subdistrict || "-"}</div>
                    </td>

                    {/* Kontak (WA) */}
                    <td className="py-3 px-4">
                      {m.phone ? (
                        <a
                          href={`https://wa.me/${m.phone.replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-mono font-medium hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{maskPhone(m.phone)}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Status Organisasi */}
                    <td className="py-3 px-4">
                      {m.orgVerificationStatus?.toLowerCase().includes("terverifikasi") ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {m.orgVerificationStatus || "Belum"}
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Hapus data anggota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {members.length} anggota</span>
          <span className="text-[11px] text-slate-400 italic">
            CRMForU Data Protection Standard
          </span>
        </div>
      </div>

      {/* 4. Import Modal */}
      <MemberImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          fetchMembers();
        }}
      />
    </div>
  );
}
