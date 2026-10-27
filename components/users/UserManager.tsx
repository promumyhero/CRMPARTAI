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

export function UserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Pengguna & Hak Akses (RBAC)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola akun pengurus partai, tetapkan peran (DPD, DPC, PAC, Operator), dan batasi hak akses wilayah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>
        </div>

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
              <option value="superadmin">Super Admin (DPD)</option>
              <option value="admin_dpc">Admin DPC (Kota/Kabupaten)</option>
              <option value="admin_pac">Admin PAC (Kecamatan)</option>
              <option value="operator">Operator / Staf Data</option>
              <option value="viewer">Viewer / Kader</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
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

      {/* Add User Modal */}
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
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
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
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
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
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteSubmit}
              disabled={formSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
            >
              {formSubmitting ? "Menghapus..." : "Ya, Hapus Pengguna"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
