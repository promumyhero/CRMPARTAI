"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Edit2,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Lock,
  BookOpen,
  Layers,
  Award,
  Users,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ROLE_CONFIGS, normalizeRole, type AppRole } from "@/lib/auth/roles";
import { WEST_KALIMANTAN_CITIES, PONTIANAK_DISTRICTS } from "@/lib/constants/territories";

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  status: "active" | "suspended";
  province?: string | null;
  city?: string | null;
  district?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface RoleDetailedGuide {
  role: AppRole;
  title: string;
  badge: string;
  level: string;
  icon: typeof Shield;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconBg: string;
    iconColor: string;
  };
  summary: string;
  recommendedFor: string;
  territorialScope: string;
  canDo: string[];
  cannotDo: string[];
}

const ROLE_GUIDES: RoleDetailedGuide[] = [
  {
    role: "superadmin",
    title: "Super Admin (DPD)",
    badge: "Otoritas Tertinggi",
    level: "Dewan Pimpinan Daerah (DPD) / Provinsi",
    icon: Award,
    colorScheme: {
      bg: "bg-purple-50/60",
      border: "border-purple-200",
      text: "text-purple-900",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-800",
      badgeBorder: "border-purple-300",
      iconBg: "bg-purple-600",
      iconColor: "text-white",
    },
    summary:
      "Pemegang kekuasaan administratif penuh atas seluruh modul CRM di seluruh wilayah Kalimantan Barat. Bertanggung jawab atas tata kelola sistem, integritas data, dan manajemen staf pengguna.",
    recommendedFor: "Ketua DPD, Sekretaris Wilayah, Kepala Biro TI & Data Center Partai.",
    territorialScope: "Seluruh Provinsi Kalimantan Barat (Semua Kota & Kabupaten).",
    canDo: [
      "Mengelola seluruh akun pengguna sistem (buat, edit role, nonaktifkan, reset password)",
      "Melihat data sensitif kader (NIK lengkap 16 digit tanpa sensor & kontak)",
      "Akses penuh tanpa batasan ke Perencanaan Kegiatan, Kalender & Rundown acara",
      "Penyusunan & persetujuan Anggaran Biaya (RAB) seluruh tingkat kepengurusan",
      "Konfigurasi Master Template Surat (.docx), Kop Surat, Stempel & Pejabat Penandatangan",
      "Hak Hapus Permanen data kader, item anggaran, serta agenda kegiatan",
      "Sinkronisasi Cloud Database Supabase & Ekspor Data Master",
    ],
    cannotDo: [
      "Tidak ada batasan teknis (Super Admin memiliki hak akses mutlak sistem).",
    ],
  },
  {
    role: "admin_dpc",
    title: "Admin DPC (Kota/Kabupaten)",
    badge: "Tingkat Cabang",
    level: "Dewan Pimpinan Cabang (DPC) / Kota-Kab",
    icon: Shield,
    colorScheme: {
      bg: "bg-blue-50/60",
      border: "border-blue-200",
      text: "text-blue-900",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-800",
      badgeBorder: "border-blue-300",
      iconBg: "bg-blue-600",
      iconColor: "text-white",
    },
    summary:
      "Pengurus tingkat Kota atau Kabupaten (contoh: Kota Pontianak, Kubu Raya) yang mengkoordinasikan kegiatan, anggaran operasional, dan kepengurusan kader di wilayah cabangnya.",
    recommendedFor: "Ketua DPC, Sekretaris DPC, Bendahara Cabang, LO KPU Daerah.",
    territorialScope: "Tingkat Kota / Kabupaten binaan sesuai penugasan.",
    canDo: [
      "Mengelola seluruh data kader dan pengurus di wilayah Kota/Kabupatennya",
      "Menyusun dan mengedit Perencanaan Kegiatan tingkat DPC",
      "Menyusun & mengelola Rencana Anggaran Biaya (RAB) kegiatan cabang",
      "Menerbitkan Surat Resmi (.docx) untuk agenda operasional dan konsolidasi partai",
      "Impor data kader masal via Excel/CSV dan ekspor data anggota",
      "Melihat NIK lengkap kader binaan untuk keperluan verifikasi berkas",
      "Menghapus data anggota di wilayah cabangnya jika diperlukan",
    ],
    cannotDo: [
      "Tidak memiliki akses ke menu Kelola Pengguna (tidak dapat membuat/mengubah user sistem)",
      "Tidak dapat mengubah pengaturan Master Template Surat tingkat DPD/Pusat",
      "Tidak dapat menjalankan migrasi database tingkat sistem (Supabase DDL)",
    ],
  },
  {
    role: "admin_pac",
    title: "Admin PAC (Kecamatan)",
    badge: "Tingkat Anak Cabang",
    level: "Pengurus Anak Cabang (PAC) / Kecamatan",
    icon: MapPin,
    colorScheme: {
      bg: "bg-emerald-50/60",
      border: "border-emerald-200",
      text: "text-emerald-900",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
      badgeBorder: "border-emerald-300",
      iconBg: "bg-emerald-600",
      iconColor: "text-white",
    },
    summary:
      "Pengurus tingkat Kecamatan (contoh: Kec. Pontianak Kota) yang memantau pergerakan basis ranting, kelurahan, dan verifikasi anggota akar rumput.",
    recommendedFor: "Ketua PAC, Sekretaris PAC, Koordinator Wilayah Kecamatan.",
    territorialScope: "Satu wilayah Kecamatan tertentu dan seluruh Kelurahan di dalamnya.",
    canDo: [
      "Melihat dan memfilter data struktur pengurus Ranting (Kelurahan) di kecamatannya",
      "Menginput anggota kader baru di tingkat kelurahan/ranting binaannya",
      "Melihat kalender agenda kegiatan partai di wilayahnya",
      "Membuat draf Surat Tugas / Surat Rekomendasi kegiatan lokal kecamatan",
      "Melihat NIK kader di kecamatannya untuk validasi lapangan",
    ],
    cannotDo: [
      "Tidak memiliki akses melihat atau mengedit modul Anggaran Keuangan (RAB)",
      "Tidak dapat menghapus data anggota secara permanen (mencegah salah hapus)",
      "Tidak memiliki akses ke Template Manager Kop Surat dan Manajemen Pengguna",
    ],
  },
  {
    role: "operator",
    title: "Operator / Staf Data",
    badge: "Staf Sekretariat",
    level: "Sekretariat & Administrasi Partai",
    icon: Users,
    colorScheme: {
      bg: "bg-amber-50/60",
      border: "border-amber-200",
      text: "text-amber-900",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-800",
      badgeBorder: "border-amber-300",
      iconBg: "bg-amber-600",
      iconColor: "text-white",
    },
    summary:
      "Staf operasional harian yang bertugas menginput berkas keanggotaan kader, melakukan verifikasi kelengkapan SIPOL KPU, mencetak KTA, dan administrasi surat-menyurat.",
    recommendedFor: "Staf Sekretariat DPD/DPC, Petugas Entri Data KTA, Tenaga Administrasi.",
    territorialScope: "Ditugaskan secara fleksibel oleh Super Admin.",
    canDo: [
      "Menginput data kader baru secara manual maupun batch via file Excel/CSV",
      "Verifikasi status keanggotaan dan kelayakan SIPOL KPU",
      "Mencetak Kartu Tanda Anggota (KTA) dan ekspor laporan berkas",
      "Menginput draf item kebutuhan belanja dan perkiraan harga pada modul RAB",
      "Menyiapkan draf naskah surat resmi kegiatan partai",
      "Melihat NIK lengkap untuk keperluan pengetikan data resmi",
    ],
    cannotDo: [
      "Tidak dapat menghapus data anggota/kegiatan secara permanen (hanya input & revisi)",
      "Tidak dapat mengelola akun pengguna atau mengubah password staf lain",
      "Tidak dapat menyetujui anggaran final tanpa izin Admin DPC/DPD",
    ],
  },
  {
    role: "viewer",
    title: "Viewer / Saksi / Tamu",
    badge: "Read Only",
    level: "Saksi TPS / Kader Simpatisan / Peninjau",
    icon: Lock,
    colorScheme: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-800",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-700",
      badgeBorder: "border-slate-300",
      iconBg: "bg-slate-600",
      iconColor: "text-white",
    },
    summary:
      "Akun peninjau yang hanya memiliki izin untuk melihat direktori anggota dan agenda kegiatan publik dengan proteksi privasi ketat.",
    recommendedFor: "Saksi Pemilu/TPS, Pengawas Eksternal, Tamu Undangan, Kader Simpatisan.",
    territorialScope: "Dibatasi ke mode tampilan publik saja.",
    canDo: [
      "Melihat daftar direktori anggota dan kader partai",
      "Menggunakan filter wilayah (Provinsi, Kota, Kecamatan, Kelurahan) untuk pencarian",
      "Melihat jadwal agenda kegiatan umum partai",
    ],
    cannotDo: [
      "🔒 NIK disensor otomatis (cth: 617101******0001) demi perlindungan data pribadi",
      "❌ Tidak dapat menambah, mengubah, atau menghapus data kader",
      "❌ Menu Anggaran & RAB, Template Manager, dan User Manager disembunyikan total",
      "❌ Tidak dapat mengekspor data database atau mencetak KTA resmi",
    ],
  },
];

const PERMISSIONS_MATRIX = [
  {
    feature: "Perencanaan Kegiatan (Agenda & Rundown)",
    superadmin: "Akses Penuh",
    admin_dpc: "Akses Penuh",
    admin_pac: "Draf Lokal",
    operator: "Input Draf",
    viewer: "Lihat Saja",
  },
  {
    feature: "Anggaran Keuangan & Pos Belanja (RAB)",
    superadmin: "Akses Penuh",
    admin_dpc: "Akses Cabang",
    admin_pac: "Tidak Ada",
    operator: "Input Pos",
    viewer: "Tidak Ada",
  },
  {
    feature: "Format Surat Resmi (.docx Native)",
    superadmin: "Akses Penuh",
    admin_dpc: "Akses Penuh",
    admin_pac: "Draf Lokal",
    operator: "Draf Surat",
    viewer: "Tidak Ada",
  },
  {
    feature: "Direktori Anggota & Filter 4 Wilayah",
    superadmin: "Akses Seluruh Wilayah",
    admin_dpc: "Wilayah Kota/Kab",
    admin_pac: "Wilayah Kecamatan",
    operator: "Akses Kerja",
    viewer: "Lihat Saja",
  },
  {
    feature: "Melihat NIK Lengkap (Tanpa Sensor)",
    superadmin: "Terbuka",
    admin_dpc: "Terbuka",
    admin_pac: "Terbuka",
    operator: "Terbuka",
    viewer: "Disensor (******)",
  },
  {
    feature: "Impor Data Kader (Excel / CSV)",
    superadmin: "Diizinkan",
    admin_dpc: "Diizinkan",
    admin_pac: "Diizinkan",
    operator: "Diizinkan",
    viewer: "Tidak Ada",
  },
  {
    feature: "Hapus Permanen Data Anggota",
    superadmin: "Diizinkan",
    admin_dpc: "Diizinkan",
    admin_pac: "Ditolak",
    operator: "Ditolak",
    viewer: "Ditolak",
  },
  {
    feature: "Kustomisasi Master Template Kop Surat",
    superadmin: "Diizinkan",
    admin_dpc: "Ditolak",
    admin_pac: "Ditolak",
    operator: "Ditolak",
    viewer: "Ditolak",
  },
  {
    feature: "Manajemen Pengguna & Hak Akses (User Manager)",
    superadmin: "Diizinkan",
    admin_dpc: "Ditolak",
    admin_pac: "Ditolak",
    operator: "Ditolak",
    viewer: "Ditolak",
  },
  {
    feature: "Sinkronisasi Cloud Supabase & Migrasi",
    superadmin: "Diizinkan",
    admin_dpc: "Ditolak",
    admin_pac: "Ditolak",
    operator: "Ditolak",
    viewer: "Ditolak",
  },
];

export function UserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Role Explanation Guide States
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [guideViewMode, setGuideViewMode] = useState<"cards" | "matrix">("cards");
  const [activeGuideTab, setActiveGuideTab] = useState<AppRole>("superadmin");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AppRole>("operator");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "suspended">("active");
  const [formCity, setFormCity] = useState("KOTA PONTIANAK");
  const [formDistrict, setFormDistrict] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) {
        showToast("Error", data.error || "Gagal memuat pengguna", "error");
        return;
      }
      setUsers(data.users || []);
    } catch {
      showToast("Error", "Gagal menghubungi server pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.users) setUsers(data.users);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("operator");
    setFormPhone("");
    setFormStatus("active");
    setFormCity("KOTA PONTIANAK");
    setFormDistrict("");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(normalizeRole(user.role));
    setFormPhone(user.phone || "");
    setFormStatus(user.status || "active");
    setFormCity(user.city || "KOTA PONTIANAK");
    setFormDistrict(user.district || "");
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          phone: formPhone || null,
          status: formStatus,
          province: "KALIMANTAN BARAT",
          city: formCity || null,
          district: formDistrict || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("Gagal", data.error || "Gagal membuat pengguna", "error");
        setFormSubmitting(false);
        return;
      }

      showToast("Berhasil", "Pengguna baru berhasil ditambahkan", "success");
      setIsAddModalOpen(false);
      fetchUsers();
    } catch {
      showToast("Error", "Gagal menghubungi server", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: formName,
        email: formEmail,
        role: formRole,
        phone: formPhone || null,
        status: formStatus,
        province: "KALIMANTAN BARAT",
        city: formCity || null,
        district: formDistrict || null,
      };

      if (formPassword.trim()) {
        body.password = formPassword.trim();
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("Gagal", data.error || "Gagal mengupdate pengguna", "error");
        setFormSubmitting(false);
        return;
      }

      showToast("Berhasil", "Perubahan data pengguna disimpan", "success");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch {
      showToast("Error", "Gagal menghubungi server", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("Gagal", data.error || "Gagal menghapus pengguna", "error");
        setFormSubmitting(false);
        return;
      }

      showToast("Berhasil", "Pengguna berhasil dihapus", "success");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch {
      showToast("Error", "Gagal menghubungi server", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const norm = normalizeRole(u.role);
    const matchesRole = filterRole === "all" || norm === filterRole;

    return matchesSearch && matchesRole;
  });

  const selectedRoleGuide =
    ROLE_GUIDES.find((g) => g.role === activeGuideTab) || ROLE_GUIDES[0];

  const currentFormRoleGuide =
    ROLE_GUIDES.find((g) => g.role === formRole) || ROLE_GUIDES[3];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Manajemen Pengguna & Hak Akses (RBAC)
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  5 Level Peran
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun pengurus partai, tetapkan peran (DPD, DPC, PAC, Operator, Viewer), dan atur cakupan wilayah penugasan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isGuideOpen
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Buka/Tutup Panduan Hak Akses"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>{isGuideOpen ? "Tutup Panduan Role" : "Lihat Panduan Role"}</span>
              {isGuideOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive Role Permissions Guide Section */}
        {isGuideOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Panduan Detail Kewenangan & Akses Setiap Role
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rincian apa saja yang dapat dan tidak dapat dilakukan oleh masing-masing tingkatan pengurus dalam sistem.
                </p>
              </div>

              {/* View Mode Toggle: Cards vs Matrix Table */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setGuideViewMode("cards")}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    guideViewMode === "cards"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kartu Rincian Role</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideViewMode("matrix")}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    guideViewMode === "matrix"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Tabel Matriks Fitur</span>
                </button>
              </div>
            </div>

            {/* View Mode 1: Detailed Role Cards with Tabs */}
            {guideViewMode === "cards" ? (
              <div className="space-y-4">
                {/* Horizontal Role Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ROLE_GUIDES.map((g) => {
                    const isSelected = activeGuideTab === g.role;
                    return (
                      <button
                        key={g.role}
                        type="button"
                        onClick={() => setActiveGuideTab(g.role)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${g.colorScheme.bg} ${g.colorScheme.border} ring-2 ring-purple-500/30`
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {g.title.split(" (")[0]}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${g.colorScheme.badgeBg} ${g.colorScheme.badgeText} ${g.colorScheme.badgeBorder}`}
                          >
                            {g.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {g.level.split(" / ")[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Role Detailed Panel */}
                <div
                  className={`p-5 rounded-2xl border ${selectedRoleGuide.colorScheme.bg} ${selectedRoleGuide.colorScheme.border} shadow-xs transition-all`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${selectedRoleGuide.colorScheme.iconBg} ${selectedRoleGuide.colorScheme.iconColor}`}
                      >
                        <selectedRoleGuide.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">
                            {selectedRoleGuide.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedRoleGuide.colorScheme.badgeBg} ${selectedRoleGuide.colorScheme.badgeText} ${selectedRoleGuide.colorScheme.badgeBorder}`}
                          >
                            {selectedRoleGuide.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                          {selectedRoleGuide.summary}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shrink-0 text-xs space-y-1.5 md:w-72">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Cakupan Wilayah
                        </span>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {selectedRoleGuide.territorialScope}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Disarankan Untuk
                        </span>
                        <span className="text-slate-600 text-[11px]">
                          {selectedRoleGuide.recommendedFor}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two columns: Can Do (Allowed) vs Cannot Do (Restricted) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
                    {/* Can Do */}
                    <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-3 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Hak Akses & Wewenang Penuh (Bisa Dilakukan):</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {selectedRoleGuide.canDo.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cannot Do / Restriksi */}
                    <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="flex items-center gap-1.5 mb-3 text-rose-800 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Batasan Operasional (Tidak Dapat Akses):</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {selectedRoleGuide.cannotDo.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode 2: Feature Matrix Table */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 min-w-50">Modul & Fitur Sistem</th>
                        <th className="px-3 py-3 text-center text-purple-700 bg-purple-50/50">
                          Super Admin
                        </th>
                        <th className="px-3 py-3 text-center text-blue-700 bg-blue-50/50">
                          Admin DPC
                        </th>
                        <th className="px-3 py-3 text-center text-emerald-700 bg-emerald-50/50">
                          Admin PAC
                        </th>
                        <th className="px-3 py-3 text-center text-amber-700 bg-amber-50/50">
                          Operator
                        </th>
                        <th className="px-3 py-3 text-center text-slate-700 bg-slate-100/50">
                          Viewer / Saksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {PERMISSIONS_MATRIX.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.feature}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>{row.superadmin}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {row.admin_dpc.includes("Ditolak") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                                <X className="w-3 h-3 text-slate-400" />
                                <span>{row.admin_dpc}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                <Check className="w-3 h-3" />
                                <span>{row.admin_dpc}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {row.admin_pac.includes("Ditolak") || row.admin_pac.includes("Tidak Ada") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                                <X className="w-3 h-3 text-slate-400" />
                                <span>{row.admin_pac}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" />
                                <span>{row.admin_pac}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {row.operator.includes("Ditolak") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                                <X className="w-3 h-3 text-slate-400" />
                                <span>{row.operator}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Check className="w-3 h-3" />
                                <span>{row.operator}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {row.viewer.includes("Ditolak") || row.viewer.includes("Tidak Ada") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                                <X className="w-3 h-3 text-slate-400" />
                                <span>{row.viewer}</span>
                              </span>
                            ) : row.viewer.includes("Disensor") ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Disensor</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                <Check className="w-3 h-3" />
                                <span>{row.viewer}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and search */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pengguna, email, atau no. telepon..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Peran / Role</option>
              <option value="superadmin">Super Admin (DPD Kalbar)</option>
              <option value="admin_dpc">Admin DPC (Kota/Kabupaten)</option>
              <option value="admin_pac">Admin PAC (Kecamatan)</option>
              <option value="operator">Operator / Staf Data</option>
              <option value="viewer">Viewer / Saksi / Tamu</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama & Email</th>
                <th className="px-4 py-3">Peran / Hak Akses</th>
                <th className="px-4 py-3">Wilayah / Teritorial</th>
                <th className="px-4 py-3">Status Akun</th>
                <th className="px-4 py-3">Login Terakhir</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat daftar pengguna sistem...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const norm = normalizeRole(u.role);
                  const config = ROLE_CONFIGS[norm] || ROLE_CONFIGS.operator;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                          {u.phone && (
                            <>
                              <span>•</span>
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badgeBg} ${config.badgeColor}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{config.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{config.level}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {u.city || u.province || "Seluruh Kalbar"}
                          </span>
                        </div>
                        {u.district && (
                          <div className="text-[11px] text-slate-500 pl-4.5">
                            Kec. {u.district}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>Dinonaktifkan</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Belum pernah login"}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Pengguna Sistem Baru"
        description="Buat akun pengurus atau operator dengan batasan hak akses sesuai tugasnya."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="cth. H. Hendra Sukma, S.E."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@crmforu.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp/HP</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Hak Akses</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as AppRole)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="superadmin">Super Admin (DPD Kalbar)</option>
                <option value="admin_dpc">Admin DPC (Kota/Kabupaten)</option>
                <option value="admin_pac">Admin PAC (Kecamatan)</option>
                <option value="operator">Operator / Staf Data</option>
                <option value="viewer">Viewer / Saksi (Read Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as "active" | "suspended")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="active">Aktif</option>
                <option value="suspended">Dinonaktifkan</option>
              </select>
            </div>
          </div>

          {/* Dynamic Helper Info Box for Selected Role */}
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${currentFormRoleGuide.colorScheme.bg} ${currentFormRoleGuide.colorScheme.border}`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Kewenangan: {currentFormRoleGuide.title}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {currentFormRoleGuide.summary}
            </p>
          </div>

          {/* Territorial configuration */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Wilayah Cakupan Tugas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Kota / Kabupaten
                </label>
                <select
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="KOTA PONTIANAK">KOTA PONTIANAK</option>
                  {WEST_KALIMANTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Kecamatan (Untuk Admin PAC)
                </label>
                <select
                  value={formDistrict}
                  onChange={(e) => setFormDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Semua Kecamatan (DPC/DPD)</option>
                  {PONTIANAK_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Pengguna & Hak Akses"
        description="Perbarui informasi profil, role, atau reset kata sandi pengguna."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reset Kata Sandi (Opsional)
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Kosongkan jika tak diubah"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp/HP</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Hak Akses</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as AppRole)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="superadmin">Super Admin (DPD Kalbar)</option>
                <option value="admin_dpc">Admin DPC (Kota/Kabupaten)</option>
                <option value="admin_pac">Admin PAC (Kecamatan)</option>
                <option value="operator">Operator / Staf Data</option>
                <option value="viewer">Viewer / Saksi (Read Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as "active" | "suspended")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="active">Aktif</option>
                <option value="suspended">Dinonaktifkan</option>
              </select>
            </div>
          </div>

          {/* Dynamic Helper Info Box for Selected Role */}
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${currentFormRoleGuide.colorScheme.bg} ${currentFormRoleGuide.colorScheme.border}`}
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Kewenangan: {currentFormRoleGuide.title}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {currentFormRoleGuide.summary}
            </p>
          </div>

          {/* Territorial configuration */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Wilayah Cakupan Tugas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Kota / Kabupaten
                </label>
                <select
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="KOTA PONTIANAK">KOTA PONTIANAK</option>
                  {WEST_KALIMANTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Kecamatan (Untuk Admin PAC)
                </label>
                <select
                  value={formDistrict}
                  onChange={(e) => setFormDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Semua Kecamatan (DPC/DPD)</option>
                  {PONTIANAK_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Delete User Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Pengguna"
        description="Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat masuk kembali ke sistem."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              Apakah Anda yakin ingin menghapus akun <b>{selectedUser?.name}</b> ({selectedUser?.email})?
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteSubmit}
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting ? "Menghapus..." : "Ya, Hapus Pengguna"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
