/**
 * Role-Based Access Control (RBAC) System
 * CRM Partai Politik & Manajemen Kader
 */

export type AppRole =
  | "superadmin"
  | "admin_dpc"
  | "admin_pac"
  | "operator"
  | "viewer"
  // Legacy backward-compatibility aliases
  | "admin"
  | "member";

export interface RoleConfig {
  id: AppRole;
  label: string;
  level: "Pusat / DPD" | "Kabupaten / DPC" | "Kecamatan / PAC" | "Sekretariat" | "Umum";
  badgeColor: string;
  badgeBg: string;
  description: string;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  superadmin: {
    id: "superadmin",
    label: "Super Admin (DPD)",
    level: "Pusat / DPD",
    badgeColor: "text-purple-700 border-purple-200",
    badgeBg: "bg-purple-50",
    description: "Akses penuh seluruh modul, kelola user, konfigurasi template & sinkronisasi database.",
  },
  admin: {
    id: "superadmin",
    label: "Super Admin (DPD)",
    level: "Pusat / DPD",
    badgeColor: "text-purple-700 border-purple-200",
    badgeBg: "bg-purple-50",
    description: "Akses penuh seluruh modul, kelola user, konfigurasi template & sinkronisasi database.",
  },
  admin_dpc: {
    id: "admin_dpc",
    label: "Admin DPC (Kota/Kabupaten)",
    level: "Kabupaten / DPC",
    badgeColor: "text-blue-700 border-blue-200",
    badgeBg: "bg-blue-50",
    description: "Kelola data anggota, kegiatan, RAB, dan surat resmi di tingkat Kota/Kabupaten.",
  },
  admin_pac: {
    id: "admin_pac",
    label: "Admin PAC (Kecamatan)",
    level: "Kecamatan / PAC",
    badgeColor: "text-emerald-700 border-emerald-200",
    badgeBg: "bg-emerald-50",
    description: "Melihat dan mengelola struktur anggota/kader di wilayah kecamatan & ranting.",
  },
  operator: {
    id: "operator",
    label: "Operator / Staf Data",
    level: "Sekretariat",
    badgeColor: "text-amber-700 border-amber-200",
    badgeBg: "bg-amber-50",
    description: "Input & verifikasi data kader, cetak KTA, serta draft kegiatan operasional.",
  },
  member: {
    id: "operator",
    label: "Operator / Staf Data",
    level: "Sekretariat",
    badgeColor: "text-amber-700 border-amber-200",
    badgeBg: "bg-amber-50",
    description: "Input & verifikasi data kader, cetak KTA, serta draft kegiatan operasional.",
  },
  viewer: {
    id: "viewer",
    label: "Viewer / Saksi / Kader",
    level: "Umum",
    badgeColor: "text-slate-700 border-slate-200",
    badgeBg: "bg-slate-50",
    description: "Akses lihat saja (Read-only) direktori anggota dan jadwal kegiatan. NIK disensor demi privasi.",
  },
};

export type Permission =
  | "users:manage"        // Menambah, mengedit, atau menonaktifkan pengguna
  | "system:sync"         // Sinkronisasi data ke Supabase / Cloud
  | "members:view"        // Melihat daftar anggota
  | "members:view_nik"    // Melihat NIK lengkap tanpa sensor
  | "members:create"      // Menambah kader baru / import data
  | "members:edit"        // Mengubah profil kader / jabatan
  | "members:delete"      // Menghapus data kader
  | "members:export"      // Export data kader ke Excel / Cetak KTA
  | "activities:view"     // Melihat agenda kegiatan
  | "activities:create"   // Membuat kegiatan baru
  | "activities:edit"     // Mengubah kegiatan
  | "activities:delete"   // Menghapus kegiatan
  | "budget:view"         // Melihat rincian anggaran & RAB
  | "budget:edit"         // Menambah / mengubah pos anggaran
  | "documents:generate"  // Membuat & download surat resmi (.docx)
  | "templates:manage";   // Mengubah template surat, kop, dan stempel

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  superadmin: [
    "users:manage",
    "system:sync",
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:delete",
    "members:export",
    "activities:view",
    "activities:create",
    "activities:edit",
    "activities:delete",
    "budget:view",
    "budget:edit",
    "documents:generate",
    "templates:manage",
  ],
  admin: [
    "users:manage",
    "system:sync",
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:delete",
    "members:export",
    "activities:view",
    "activities:create",
    "activities:edit",
    "activities:delete",
    "budget:view",
    "budget:edit",
    "documents:generate",
    "templates:manage",
  ],
  admin_dpc: [
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:delete",
    "members:export",
    "activities:view",
    "activities:create",
    "activities:edit",
    "activities:delete",
    "budget:view",
    "budget:edit",
    "documents:generate",
  ],
  admin_pac: [
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:export",
    "activities:view",
    "activities:create",
    "documents:generate",
  ],
  operator: [
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:export",
    "activities:view",
    "activities:create",
    "activities:edit",
    "budget:view",
    "documents:generate",
  ],
  member: [
    "members:view",
    "members:view_nik",
    "members:create",
    "members:edit",
    "members:export",
    "activities:view",
    "activities:create",
    "activities:edit",
    "budget:view",
    "documents:generate",
  ],
  viewer: [
    "members:view",
    "activities:view",
  ],
};

/**
 * Normalisasi role string ke id role standar
 */
export function normalizeRole(role?: string | null): AppRole {
  if (!role) return "viewer";
  const r = role.toLowerCase().trim();
  if (r === "admin" || r === "superadmin") return "superadmin";
  if (r === "admin_dpc" || r === "dpc") return "admin_dpc";
  if (r === "admin_pac" || r === "pac") return "admin_pac";
  if (r === "operator" || r === "member") return "operator";
  return "viewer";
}

/**
 * Cek apakah sebuah role memiliki izin (permission) tertentu
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  const norm = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[norm] || [];
  return permissions.includes(permission);
}

/**
 * Sensor NIK jika pengguna tidak memiliki izin 'members:view_nik'
 * Contoh: 6171012304850001 -> 617101******0001
 */
export function maskNik(nik?: string | null, canViewFull: boolean = false): string {
  if (!nik) return "-";
  if (canViewFull) return nik;
  if (nik.length < 10) return "******";
  return nik.substring(0, 6) + "******" + nik.substring(nik.length - 4);
}
