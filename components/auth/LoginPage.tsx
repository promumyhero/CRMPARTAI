"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { type AppRole } from "@/lib/auth/roles";

export interface AuthUserData {
  id: number;
  name: string;
  email: string;
  role: string;
  normalizedRole: string;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUserData) => void;
}

const DEMO_ACCOUNTS: Array<{
  roleId: AppRole;
  title: string;
  email: string;
  pass: string;
  badge: string;
  color: string;
  bg: string;
  desc: string;
}> = [
  {
    roleId: "superadmin",
    title: "Super Admin (DPD Kalbar)",
    email: "admin@crmforu.com",
    pass: "admin123",
    badge: "Akses Penuh",
    color: "text-purple-700 border-purple-200",
    bg: "bg-purple-50 hover:bg-purple-100/80",
    desc: "Akses seluruh modul, kelola user, template & sinkronisasi database.",
  },
  {
    roleId: "admin_dpc",
    title: "Admin DPC (Kota Pontianak)",
    email: "dpc.pontianak@crmforu.com",
    pass: "dpc123",
    badge: "Tingkat Kota",
    color: "text-blue-700 border-blue-200",
    bg: "bg-blue-50 hover:bg-blue-100/80",
    desc: "Kelola kader, kegiatan, RAB anggaran, & surat resmi tingkat kota.",
  },
  {
    roleId: "admin_pac",
    title: "Admin PAC (Pontianak Kota)",
    email: "pac.pontianakkota@crmforu.com",
    pass: "pac123",
    badge: "Tingkat Kecamatan",
    color: "text-emerald-700 border-emerald-200",
    bg: "bg-emerald-50 hover:bg-emerald-100/80",
    desc: "Kelola struktur anggota & pengurus kelurahan/ranting di kecamatannya.",
  },
  {
    roleId: "operator",
    title: "Operator / Staf Data",
    email: "operator@crmforu.com",
    pass: "operator123",
    badge: "Sekretariat",
    color: "text-amber-700 border-amber-200",
    bg: "bg-amber-50 hover:bg-amber-100/80",
    desc: "Input & verifikasi kader, cetak KTA, dan draft administrasi.",
  },
  {
    roleId: "viewer",
    title: "Viewer / Saksi / Tamu",
    email: "kader@crmforu.com",
    pass: "kader123",
    badge: "Read Only",
    color: "text-slate-700 border-slate-200",
    bg: "bg-slate-50 hover:bg-slate-100/80",
    desc: "Akses lihat data direktori anggota (NIK disensor otomatis).",
  },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Silakan masukkan email dan kata sandi.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setIsLocked(true);
        }
        setErrorMessage(data.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        setLoading(false);
        return;
      }

      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch {
      setErrorMessage("Terjadi kendala koneksi ke server. Pastikan jaringan stabil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center z-10">
        {/* Left Side: System Information & Security Value Props */}
        <div className="lg:col-span-5 text-white space-y-4 sm:space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Sistem Keamanan Terenkripsi Enterprise</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sistem Informasi <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-sky-300 to-indigo-300">
                Manajemen Partai & Kader
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Platform terintegrasi untuk Direktori Anggota, Struktur Kepengurusan Bertingkat, Perencanaan Kegiatan, serta Anggaran RAB.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-2.5 pt-2 hidden sm:block">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>Proteksi SQL Injection & XSS:</b> Validasi data ketat Zod & prepared statement Drizzle ORM.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>Anti Brute-Force & Timing Attack:</b> Pembatasan otomatis 5 percobaan dan enkripsi Bcrypt Salt 12.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <b>Hak Akses Bertingkat (RBAC):</b> Super Admin DPD, Admin DPC Kota, Admin PAC Kecamatan, Operator, dan Viewer.
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-5 sm:p-8 backdrop-blur-lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>Masuk ke Akun Anda</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan kredensial yang terdaftar untuk mengakses hak akses Anda.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base shadow-xs">
              C
            </div>
          </div>

          {/* Error / Alert Banner */}
          {errorMessage && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                isLocked
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crmforu.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50/50 hover:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-slate-50/50 hover:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Ingat saya selama 30 hari</span>
              </label>
              <span className="text-slate-400 text-[11px]">Sesi aman HttpOnly</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memverifikasi kredensial...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher / Role Previews */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Uji Coba Cepat Hak Akses (1-Click Demo)</span>
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk mengisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email, acc.pass)}
                  className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between cursor-pointer ${acc.bg} ${
                    email === acc.email ? "ring-2 ring-blue-600 border-blue-400" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 truncate text-[11px]">{acc.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${acc.color}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.email}</div>
                  <div className="text-[9px] text-slate-400 mt-1 line-clamp-1">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <span>© 2026 CRM Partai Politik & Manajemen Kader</span>
        <span className="hidden sm:inline">•</span>
        <span>Arsitektur Multi-Role Berjenjang</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-blue-400 font-medium">Supabase & PostgreSQL Ready</span>
      </div>
    </div>
  );
}
