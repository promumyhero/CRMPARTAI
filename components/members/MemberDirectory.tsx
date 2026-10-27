"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Filter,
  RotateCcw,
  ChevronRight,
  Building2,
} from "lucide-react";
import type { PartyMember } from "@/lib/db/schema";
import { MemberImportModal } from "./MemberImportModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonCard, SkeletonRow } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getTerritoryOptions } from "@/lib/constants/territories";

interface StatsData {
  totalMembers: number;
  totalMale: number;
  totalFemale: number;
  femalePercentage: number;
  totalOfficials: number;
  totalRegular: number;
  totalVerified: number;
  districts: Record<string, number>;
  subdistricts?: Record<string, number>;
  cities?: Record<string, number>;
  provinces?: Record<string, number>;
  existingTerritories?: Array<{
    province?: string | null;
    city?: string | null;
    district?: string | null;
    subdistrict?: string | null;
  }>;
}

export function MemberDirectory() {
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Basic Filters
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [gender, setGender] = useState("");

  // Hierarchical Territorial Filters
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");

  const [unmaskSensitive, setUnmaskSensitive] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [targetDeleteMember, setTargetDeleteMember] = useState<PartyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showDeleteToast, showToast } = useToast();

  // Territory Options Helper (merges master data with actual database entries)
  const territoryHelper = useMemo(() => {
    return getTerritoryOptions(stats?.existingTerritories || []);
  }, [stats?.existingTerritories]);

  const provinceOptions = useMemo(() => territoryHelper.getProvinces(), [territoryHelper]);
  const cityOptions = useMemo(() => territoryHelper.getCities(province), [territoryHelper, province]);
  const districtOptions = useMemo(
    () => territoryHelper.getDistricts(province, city),
    [territoryHelper, province, city]
  );
  const subdistrictOptions = useMemo(
    () => territoryHelper.getSubdistricts(province, city, district),
    [territoryHelper, province, city, district]
  );

  // Cascading Selection Handlers
  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    setCity("");
    setDistrict("");
    setSubdistrict("");
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setDistrict("");
    setSubdistrict("");
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    setSubdistrict("");
  };

  const handleResetTerritory = () => {
    setProvince("");
    setCity("");
    setDistrict("");
    setSubdistrict("");
  };

  const handleResetAllFilters = () => {
    handleResetTerritory();
    setPosition("");
    setGender("");
    setSearch("");
  };

  // Fetch members and stats
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (province) params.set("province", province);
      if (city) params.set("city", city);
      if (district) params.set("district", district);
      if (subdistrict) params.set("subdistrict", subdistrict);
      if (position) params.set("position", position);
      if (gender) params.set("gender", gender);
      params.set("limit", "150");

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
  }, [search, province, city, district, subdistrict, position, gender]);

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

  const handleConfirmDelete = async () => {
    if (!targetDeleteMember) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/members/${targetDeleteMember.id}`, { method: "DELETE" });
      if (res.ok) {
        const deletedName = targetDeleteMember.name;
        showDeleteToast(deletedName);
        setMembers((prev) => prev.filter((m) => m.id !== targetDeleteMember.id));
        setTargetDeleteMember(null);
        fetchMembers();
      } else {
        showToast("Gagal Menghapus", "Terjadi kesalahan saat menghapus anggota", "error");
      }
    } catch {
      showToast("Gagal Menghapus", "Tidak dapat terhubung ke server", "error");
    } finally {
      setIsDeleting(false);
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

  // Active Structure Level Label
  const activeLevelLabel = useMemo(() => {
    if (subdistrict) return { label: `Ranting: Kel. ${subdistrict}`, badge: "Tingkat Ranting / Kelurahan" };
    if (district) return { label: `PAC: Kec. ${district}`, badge: "Tingkat PAC / Kecamatan" };
    if (city) return { label: `DPC: ${city}`, badge: "Tingkat DPC / Kota-Kab" };
    if (province) return { label: `DPD: ${province}`, badge: "Tingkat DPD / Provinsi" };
    return { label: "Seluruh Struktur Wilayah", badge: "Nasional / Semua Basis" };
  }, [province, city, district, subdistrict]);

  const hasTerritorialFilter = Boolean(province || city || district || subdistrict);
  const hasAnyFilter = Boolean(province || city || district || subdistrict || position || search || gender);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Stats Bar (With Skeleton Loading) */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : stats ? (
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
      ) : null}

      {/* 2. Hierarchical Territorial Filter Card (Provinsi -> Kota/Kab -> Kecamatan -> Kelurahan) */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Filter Wilayah & Tingkat Kepengurusan Struktur
                </h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {activeLevelLabel.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pilih secara bertingkat: DPD (Provinsi) &rarr; DPC (Kota/Kab) &rarr; PAC (Kecamatan) &rarr; Ranting (Kelurahan) untuk melihat seluruh susunan pengurus pada tingkatan tersebut.
              </p>
            </div>
          </div>

          {hasTerritorialFilter && (
            <button
              onClick={handleResetTerritory}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto hover:underline transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Wilayah</span>
            </button>
          )}
        </div>

        {/* 4 Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Provinsi */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              1. Provinsi (DPD)
            </label>
            <select
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
            >
              <option value="">Semua Provinsi</option>
              {provinceOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kota / Kab */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              2. Kota / Kabupaten (DPC)
            </label>
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
            >
              <option value="">Semua Kota / Kab</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kecamatan */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              3. Kecamatan (PAC)
            </label>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
            >
              <option value="">Semua Kecamatan (PAC)</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Kelurahan / Desa */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              4. Kelurahan / Desa (Ranting)
            </label>
            <select
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold"
            >
              <option value="">Semua Kelurahan (Ranting)</option>
              {subdistrictOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Control Bar (Search, Jabatan, Gender, Data Masking & Import Button) */}
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

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Jabatan Filter */}
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-700 font-medium"
          >
            <option value="">Semua Jabatan</option>
            <option value="Ketua">Ketua</option>
            <option value="Sekretaris">Sekretaris</option>
            <option value="Bendahara">Bendahara</option>
            <option value="Wakil Ketua">Wakil Ketua</option>
            <option value="Wakil Sekretaris">Wakil Sekretaris</option>
            <option value="Wakil Bendahara">Wakil Bendahara</option>
            <option value="Koordinator">Koordinator</option>
            <option value="regular">Regular / Anggota</option>
          </select>

          {/* Gender Filter */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-700 font-medium"
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
            title="Muat ulang data anggota"
            aria-label="Muat ulang data anggota"
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

      {/* 4. Active Structure Breadcrumb & Indicator Banner */}
      {hasAnyFilter && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-900 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-blue-800 flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Hierarki Aktif:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-white border border-blue-200 font-semibold text-blue-800">
                {province || "Semua DPD"}
              </span>
              <ChevronRight className="w-3 h-3 text-blue-400" />
              <span className="px-2 py-0.5 rounded bg-white border border-blue-200 font-semibold text-blue-800">
                {city || "Semua DPC"}
              </span>
              <ChevronRight className="w-3 h-3 text-blue-400" />
              <span className="px-2 py-0.5 rounded bg-white border border-blue-200 font-semibold text-blue-800">
                {district ? `Kec. ${district} (PAC)` : "Semua PAC"}
              </span>
              <ChevronRight className="w-3 h-3 text-blue-400" />
              <span
                className={`px-2 py-0.5 rounded font-bold border transition ${
                  subdistrict
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white border-blue-200 text-blue-800"
                }`}
              >
                {subdistrict ? `Kel. ${subdistrict} (Ranting)` : "Semua Ranting"}
              </span>
            </div>

            {position && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-800 font-bold text-[11px]">
                Jabatan: &ldquo;{position}&rdquo;
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-blue-700 tabular-nums">
              {members.length} kader ditampilkan
            </span>
            <button
              onClick={handleResetAllFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
            >
              Reset Semua
            </button>
          </div>
        </div>
      )}

      {/* 5. Table of Members */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">No. KTA & Nama</th>
                <th className="py-3 px-4">Jabatan Struktural</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">Gender & Usia</th>
                <th className="py-3 px-4">Wilayah Kepengurusan</th>
                <th className="py-3 px-4">Kontak (WA)</th>
                <th className="py-3 px-4">Status Organisasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && members.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={8} />
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada kader yang cocok dengan filter wilayah/jabatan ini</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan pilihan kelurahan, kecamatan, atau klik &ldquo;Reset Wilayah&rdquo;.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* KTA & Nama */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-blue-600 font-mono font-medium">
                        KTA: {m.ktaNumber}
                      </div>
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
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{m.district || "-"}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-semibold pl-4">
                        {m.subdistrict ? `Kel. ${m.subdistrict}` : "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4 truncate max-w-40">
                        {m.city ? m.city.replace("KABUPATEN", "Kab.").replace("KOTA", "Kota") : "Pontianak"}
                      </div>
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
                        onClick={() => setTargetDeleteMember(m)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Hapus data anggota"
                        aria-label="Hapus data anggota"
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
          <span>Menampilkan {members.length} anggota kader</span>
          <span className="text-[11px] text-slate-400 italic">
            Hierarki Wilayah &bull; DPD &bull; DPC &bull; PAC &bull; Ranting
          </span>
        </div>
      </div>

      {/* 6. Import Modal */}
      <MemberImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          fetchMembers();
        }}
      />

      {/* 7. Confirm Delete Alert Dialog (shadcn/ui style) */}
      <ConfirmDialog
        isOpen={!!targetDeleteMember}
        onClose={() => {
          if (!isDeleting) setTargetDeleteMember(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Kader / Pengurus"
        description={`Apakah Anda yakin ingin menghapus data anggota "${targetDeleteMember?.name}"? Tindakan ini akan menghapus catatan kader dari sistem.`}
        confirmLabel="Hapus Kader"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
