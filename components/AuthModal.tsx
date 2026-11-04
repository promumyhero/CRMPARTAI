"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { useToast } from "./ui/Toast";
import { KeyRound, Mail } from "lucide-react";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok || !data.user) {
        showToast("Gagal Masuk", data.error || "Kredensial tidak valid", "error");
        setLoading(false);
        return;
      }

      showToast("Berhasil Masuk", `Selamat datang kembali, ${data.user.name}`, "success");
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
      title="Masuk ke Sistem CRM Partai"
      description="Masukkan alamat email dan kata sandi akun resmi yang terdaftar."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="modal-email" className="block text-xs font-semibold text-slate-700 mb-1">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="modal-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@organisasi.id"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="modal-password" className="block text-xs font-semibold text-slate-700 mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
            <input
              id="modal-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Memverifikasi…" : "Masuk Sekarang"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
