"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { useToast } from "./ui/Toast";
import { KeyRound, Mail, User, Shield } from "lucide-react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok || !data.user) {
        showToast("Gagal", data.error || "Terjadi kesalahan", "error");
        setLoading(false);
        return;
      }

      showToast(
        "Berhasil",
        isRegister ? "Akun berhasil didaftarkan" : `Selamat datang kembali, ${data.user.name}`,
        "success"
      );
      onSuccess(data.user);
      onClose();
    } catch {
      showToast("Error", "Gagal menghubungi server autentikasi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? "Tambah / Daftar Anggota Tim" : "Masuk ke Sistem CRMForU"}
      description={
        isRegister
          ? "Daftarkan akun anggota tim baru untuk kolaborasi kegiatan dan RAB"
          : "Gunakan akun yang telah terdaftar atau akun default (admin@crmforu.com / admin123)"
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Rian Pratama, S.Kom"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@organisasi.id"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="admin">Administrator (Akses Penuh)</option>
                <option value="member">Anggota Tim / Member (Operator)</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Memproses..." : isRegister ? "Daftarkan Pengguna" : "Masuk Sekarang"}
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Buat akun tim baru"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
