import * as XLSX from "xlsx";
import type { NewPartyMember } from "@/lib/db/schema";

export interface ParsedMemberRow {
  rowNumber: number;
  data: NewPartyMember;
  status: "valid" | "warning" | "error";
  issues: string[];
}

export interface ParseExcelResult {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: ParsedMemberRow[];
  detectedColumns: string[];
}

// Helper to normalize header keys
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Clean phone numbers
function formatPhoneNumber(raw: unknown): string | undefined {
  if (!raw) return undefined;
  let str = String(raw).trim().replace(/[^\d+]/g, "");
  if (!str) return undefined;
  if (str.startsWith("08")) {
    str = "08" + str.substring(2);
  } else if (str.startsWith("628")) {
    str = "08" + str.substring(3);
  } else if (str.startsWith("+628")) {
    str = "08" + str.substring(4);
  }
  return str;
}

// Clean date strings
function formatDateString(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (raw instanceof Date) {
    return raw.toISOString().split("T")[0];
  }
  const str = String(raw).trim();
  // Check if YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // Check if DD/MM/YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return str;
}

export function parseMemberExcelBuffer(buffer: ArrayBuffer): ParseExcelResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with headers
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      rows: [],
      detectedColumns: [],
    };
  }

  const detectedColumns = Object.keys(rawRows[0] || {});
  const parsedRows: ParsedMemberRow[] = [];
  const seenKtas = new Set<string>();
  const seenNiks = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // considering header as row 1
    const mapped: Record<string, string> = {};

    for (const [colName, val] of Object.entries(row)) {
      const norm = normalizeKey(colName);
      const strVal = String(val ?? "").trim();

      if (norm.includes("kta") || norm === "nokta" || norm === "nomorkta") {
        mapped.ktaNumber = strVal;
      } else if (norm === "nama" || norm === "namalengkap" || norm === "name") {
        mapped.name = strVal;
      } else if (norm === "nik" || norm === "nomorindukkependudukan") {
        mapped.nik = strVal;
      } else if (norm.includes("kelamin") || norm === "jk" || norm === "gender") {
        mapped.gender = strVal;
      } else if (norm.includes("tempatlahir") || norm === "tempat") {
        mapped.birthPlace = strVal;
      } else if (norm.includes("tanggallahir") || norm === "tgllahir" || norm === "dob") {
        mapped.birthDate = strVal;
      } else if (norm.includes("perkawinan") || norm.includes("nikah") || norm === "maritalstatus") {
        mapped.maritalStatus = strVal;
      } else if (norm.includes("warganegara") || norm === "kewarganegaraan") {
        mapped.nationality = strVal;
      } else if (norm === "pekerjaan" || norm === "profesi" || norm === "job") {
        mapped.job = strVal;
      } else if (norm.includes("emailterverifikasi") || norm === "emailverified") {
        mapped.isEmailVerified = strVal;
      } else if (norm === "email") {
        mapped.email = strVal;
      } else if (norm.includes("telepon") || norm.includes("nohp") || norm.includes("nowa") || norm === "phone") {
        mapped.phone = strVal;
      } else if (norm === "provinsi" || norm === "province") {
        mapped.province = strVal;
      } else if (norm.includes("kab") || norm.includes("kota") || norm === "city") {
        mapped.city = strVal;
      } else if (norm.includes("kecamatan") || norm === "district") {
        mapped.district = strVal;
      } else if (norm.includes("kelurahan") || norm.includes("desa") || norm === "subdistrict") {
        mapped.subdistrict = strVal;
      } else if (norm === "alamat" || norm === "alamatlengkap" || norm === "address") {
        mapped.address = strVal;
      } else if (norm.includes("kodepos") || norm === "postalcode") {
        mapped.postalCode = strVal;
      } else if (norm === "jabatan" || norm === "posisi" || norm === "position" || norm === "role") {
        mapped.position = strVal;
      } else if (norm === "status" || norm === "statuskeanggotaan") {
        mapped.membershipStatus = strVal;
      } else if (norm.includes("verifikasiorganisasi")) {
        mapped.orgVerificationStatus = strVal;
      } else if (norm.includes("validasidpp")) {
        mapped.dppValidationStatus = strVal;
      } else if (norm.includes("statuskpu") || norm.includes("perubahanstatuskpu")) {
        mapped.kpuStatusChangeDate = strVal;
      } else if (norm === "id") {
        mapped.sourceId = strVal;
      }
    }

    const issues: string[] = [];
    let status: "valid" | "warning" | "error" = "valid";

    // Validasi No KTA
    const kta = mapped.ktaNumber || "";
    if (!kta) {
      status = "error";
      issues.push("No. KTA kosong.");
    } else if (seenKtas.has(kta)) {
      status = "warning";
      issues.push("Duplikat No. KTA dalam file ini.");
    } else {
      seenKtas.add(kta);
    }

    // Validasi Nama
    const name = mapped.name || "";
    if (!name) {
      status = "error";
      issues.push("Nama anggota kosong.");
    }

    // Validasi NIK
    const nik = mapped.nik || "";
    if (!nik) {
      if (status !== "error") status = "warning";
      issues.push("NIK belum terisi.");
    } else if (nik.length < 16) {
      if (status !== "error") status = "warning";
      issues.push(`NIK kurang dari 16 digit (${nik.length} digit).`);
    } else if (seenNiks.has(nik)) {
      if (status !== "error") status = "warning";
      issues.push("Duplikat NIK dalam file ini.");
    } else {
      seenNiks.add(nik);
    }

    // Validasi Telepon
    const phone = formatPhoneNumber(mapped.phone);
    if (!phone && status !== "error") {
      issues.push("No. Telepon/WA belum diisi.");
      if (status === "valid") status = "warning";
    }

    // Validasi Wilayah
    if (!mapped.district && status === "valid") {
      status = "warning";
      issues.push("Kecamatan belum terisi.");
    }

    const data: NewPartyMember = {
      ktaNumber: kta,
      name,
      sourceId: mapped.sourceId || undefined,
      nik: nik || undefined,
      gender: mapped.gender || undefined,
      birthPlace: mapped.birthPlace || undefined,
      birthDate: formatDateString(mapped.birthDate),
      maritalStatus: mapped.maritalStatus || undefined,
      nationality: mapped.nationality || "Indonesia",
      job: mapped.job || undefined,
      email: mapped.email || undefined,
      isEmailVerified: mapped.isEmailVerified ? mapped.isEmailVerified.toLowerCase() === "ya" || mapped.isEmailVerified.toLowerCase() === "true" : false,
      phone: phone || undefined,
      province: mapped.province || "KALIMANTAN BARAT",
      city: mapped.city || "KOTA PONTIANAK",
      district: mapped.district || undefined,
      subdistrict: mapped.subdistrict || undefined,
      address: mapped.address || undefined,
      postalCode: mapped.postalCode || undefined,
      position: mapped.position || "regular",
      membershipStatus: mapped.membershipStatus || "Aktif",
      orgVerificationStatus: mapped.orgVerificationStatus || "Belum Terverifikasi",
      dppValidationStatus: mapped.dppValidationStatus || "Belum Divalidasi DPP",
      kpuStatusChangeDate: mapped.kpuStatusChangeDate ? new Date(mapped.kpuStatusChangeDate) : undefined,
    };

    parsedRows.push({
      rowNumber,
      data,
      status,
      issues,
    });
  });

  const validCount = parsedRows.filter((r) => r.status === "valid").length;
  const warningCount = parsedRows.filter((r) => r.status === "warning").length;
  const errorCount = parsedRows.filter((r) => r.status === "error").length;

  return {
    totalRows: parsedRows.length,
    validCount,
    warningCount,
    errorCount,
    rows: parsedRows,
    detectedColumns,
  };
}
