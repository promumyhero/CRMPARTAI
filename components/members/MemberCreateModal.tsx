"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin,
  CreditCard,
  User,
  Phone,
} from "lucide-react";
import { WEST_KALIMANTAN_CITIES, MASTER_TERRITORIES } from "@/lib/constants/territories";
import type { DuplicateMemberMatch } from "@/lib/services/data-store";

interface MemberCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberCreateModal({ isOpen, onClose, onSuccess }: MemberCreateModalProps) {
  const [ktaNumber, setKtaNumber] = useState("");
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Laki-laki");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("regular");
  const [city, setCity] = useState("KOTA PONTIANAK");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [address, setAddress] = useState("");

  // Duplicate detection state
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMemberMatch[]>([]);
  const [allowOverwrite, setAllowOverwrite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Real-time debounced duplicate check against database when No. KTA or NIK is typed
  useEffect(() => {
    if (!isOpen) return;
    const trimmedKta = ktaNumber.trim();
    const trimmedNik = nik.trim();

    if (trimmedKta.length < 3 && trimmedNik.length < 16) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const params = new URLSearchParams({ checkDuplicate: "1" });
        if (trimmedKta.length >= 3) params.set("ktaNumber", trimmedKta);
        if (trimmedNik.length === 16) params.set("nik", trimmedNik);

        const res = await fetch(`/api/members?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as {
            isDuplicate?: boolean;
            duplicates?: DuplicateMemberMatch[];
          };
          const found = data.duplicates || [];
          setDuplicateMatches(found);
          if (found.length === 0) {
            setAllowOverwrite(false);
          }
        }
      } catch {
        // Ignore aborted or transient network errors
      } finally {
        if (!controller.signal.aborted) {
          setCheckingDuplicate(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [ktaNumber, nik, isOpen]);

  const kalbarCities = MASTER_TERRITORIES[0]?.cities || [];
  const selectedCityObj = kalbarCities.find((c) => c.name === city);
  const districtList = selectedCityObj ? selectedCityObj.districts : [];
  const selectedDistrictObj = districtList.find((d) => d.name === district);
  const subdistrictList: string[] = selectedDistrictObj ? selectedDistrictObj.subdistricts : [];

  const resetForm = () => {
    setKtaNumber("");
    setNik("");
    setName("");
    setGender("Laki-laki");
    setBirthPlace("");
    setBirthDate("");
    setPhone("");
    setPosition("regular");
    setCity("KOTA PONTIANAK");
    setDistrict("");
    setSubdistrict("");
    setAddress("");
    setDuplicateMatches([]);
    setAllowOverwrite(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!ktaNumber.trim() || !name.trim()) {
      setFormError("No. KTA dan Nama Lengkap wajib diisi.");
      return;
    }

    if (nik.trim() && !/^\d{16}$/.test(nik.trim())) {
      setFormError("NIK harus terdiri dari tepat 16 digit angka.");
      return;
    }

    if (duplicateMatches.length > 0 && !allowOverwrite) {
      setFormError(
        "Data anggota terdeteksi duplikat di database. Harap periksa kembali No. KTA / NIK atau centang opsi perbarui data lama."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ktaNumber: ktaNumber.trim(),
          nik: nik.trim() || undefined,
          name: name.trim(),
          gender,
          birthPlace: birthPlace.trim() || undefined,
          birthDate: birthDate || undefined,
          phone: phone.trim() || undefined,
          position,
          province: "KALIMANTAN BARAT",
          city,
          district: district.trim() || undefined,
          subdistrict: subdistrict.trim() || undefined,
          address: address.trim() || undefined,
          allowOverwrite,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        code?: string;
        duplicates?: DuplicateMemberMatch[];
        message?: string;
      };

      if (!res.ok) {
        if (res.status === 409 && data.duplicates) {
          setDuplicateMatches(data.duplicates);
        }
        setFormError(data.error || "Gagal menyimpan data anggota.");
        setSubmitting(false);
        return;
      }

      showToast(
        "Berhasil Disimpan",
        data.message || `Anggota ${name} berhasil disimpan ke database`,
        "success"
      );
      resetForm();
      onSuccess();
      onClose();
    } catch {
      setFormError("Gagal menghubungi server. Periksa koneksi jaringan Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKtaChange = (val: string) => {
    setKtaNumber(val);
    if (val.trim().length < 3 && nik.trim().length < 16) {
      setDuplicateMatches([]);
      setAllowOverwrite(false);
      setCheckingDuplicate(false);
    }
  };

  const handleNikChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, "");
    setNik(cleaned);
    if (ktaNumber.trim().length < 3 && cleaned.trim().length < 16) {
      setDuplicateMatches([]);
      setAllowOverwrite(false);
      setCheckingDuplicate(false);
    }
  };

  const hasDuplicate =
    (ktaNumber.trim().length >= 3 || nik.trim().length === 16) && duplicateMatches.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Data Anggota / Kader Partai"
      description="Dilengkapi deteksi duplikat otomatis berdasarkan No. KTA dan NIK (16 Digit) di wilayah Kalimantan Barat."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {hasDuplicate && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <div className="font-bold text-amber-900">
                  Peringatan Duplikat Data di Database!
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Sistem menemukan anggota yang sudah terdaftar dengan identitas yang sama:
                </p>
                <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5 space-y-1">
                  {duplicateMatches.map((m) => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>{" "}
                        <span className="text-[11px] font-mono text-blue-700">
                          (KTA: {m.ktaNumber} {m.nik ? `• NIK: ${m.nik}` : ""})
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {m.position} • {m.district || m.city || "Kalbar"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none font-semibold text-amber-900">
              <input
                type="checkbox"
                checked={allowOverwrite}
                onChange={(e) => setAllowOverwrite(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <span>
                Saya memahami peringatan ini dan ingin memperbarui data anggota tersebut (tanpa menduplikasi baris)
              </span>
            </label>
          </div>
        )}

        {/* Row 1: No. KTA & NIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="member-kta" className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor KTA <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                id="member-kta"
                type="text"
                required
                value={ktaNumber}
                onChange={(e) => handleKtaChange(e.target.value)}
                placeholder="cth. 61710120260001"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="member-nik" className="block text-xs font-semibold text-slate-700">
                NIK (16 Digit Sesuai KTP)
              </label>
              {checkingDuplicate && (
                <span className="text-[10px] text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa duplikat…
                </span>
              )}
              {!checkingDuplicate && !hasDuplicate && (ktaNumber.trim().length >= 4 || nik.trim().length === 16) && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Belum terdaftar (Unik)
                </span>
              )}
            </div>
            <input
              id="member-nik"
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={nik}
              onChange={(e) => handleNikChange(e.target.value)}
              placeholder="16 digit NIK"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Nama Lengkap & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="member-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                id="member-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap kader / pengurus"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="member-gender" className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              id="member-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        {/* Row 3: Jabatan, No. WA, Tempat & Tanggal Lahir */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label htmlFor="member-pos" className="block text-xs font-semibold text-slate-700 mb-1">
              Jabatan Struktural
            </label>
            <select
              id="member-pos"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="regular">Regular / Anggota</option>
              <option value="Ketua">Ketua</option>
              <option value="Wakil Ketua">Wakil Ketua</option>
              <option value="Sekretaris">Sekretaris</option>
              <option value="Wakil Sekretaris">Wakil Sekretaris</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Wakil Bendahara">Wakil Bendahara</option>
              <option value="Koordinator">Koordinator / Biro</option>
              <option value="Saksi">Saksi / Bappilu</option>
            </select>
          </div>

          <div>
            <label htmlFor="member-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              No. Telepon / WA
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                id="member-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="member-pob" className="block text-xs font-semibold text-slate-700 mb-1">
              Tempat Lahir
            </label>
            <input
              id="member-pob"
              type="text"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="cth. Pontianak"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="member-dob" className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Lahir
            </label>
            <input
              id="member-dob"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 4: Wilayah Kepengurusan Kalimantan Barat */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Wilayah Kepengurusan (Provinsi Kalimantan Barat)</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              DPD KALIMANTAN BARAT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="member-city" className="block text-[11px] font-medium text-slate-600 mb-1">
                Kota / Kabupaten (DPC)
              </label>
              <select
                id="member-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setDistrict("");
                  setSubdistrict("");
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {WEST_KALIMANTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="member-district" className="block text-[11px] font-medium text-slate-600 mb-1">
                Kecamatan (PAC)
              </label>
              {districtList.length > 0 ? (
                <select
                  id="member-district"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setSubdistrict("");
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Pilih Kecamatan…</option>
                  {districtList.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="member-district"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Nama Kecamatan"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              )}
            </div>

            <div>
              <label htmlFor="member-subdistrict" className="block text-[11px] font-medium text-slate-600 mb-1">
                Kelurahan / Desa (Ranting)
              </label>
              {subdistrictList.length > 0 ? (
                <select
                  id="member-subdistrict"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Pilih Kelurahan…</option>
                  {subdistrictList.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="member-subdistrict"
                  type="text"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  placeholder="Nama Kelurahan/Desa"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="member-address" className="block text-[11px] font-medium text-slate-600 mb-1">
              Alamat Lengkap Domisili (RT/RW/Jalan)
            </label>
            <input
              id="member-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="cth. Jl. Ahmad Yani No. 12 RT 002 / RW 004"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || (hasDuplicate && !allowOverwrite)}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {submitting
                ? "Menyimpan…"
                : hasDuplicate && allowOverwrite
                  ? "Perbarui Data Kader"
                  : "Simpan Kader Baru"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

