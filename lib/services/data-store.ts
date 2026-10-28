import fs from "fs";
import path from "path";
import { db, testDbConnection } from "@/lib/db";
import {
  users,
  activities,
  budgetItems,
  documents,
  documentTemplates,
  partyMembers,
  type User,
  type Activity,
  type BudgetItem,
  type Document as DocType,
  type AutofillEntry,
  type DocumentTemplate,
  type PartyMember,
  type NewPartyMember,
} from "@/lib/db/schema";
import { eq, desc, and, isNull, or, ilike, not } from "drizzle-orm";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Local storage path: In Vercel serverless functions, /var/task is read-only, so use /tmp/.data
const IS_VERCEL = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_VERCEL ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");
const LOCAL_DB_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_SUPABASE_URL = "https://hsxzsvnhdomkhxtzuoff.supabase.co";
const DEFAULT_SUPABASE_SERVICE_KEY = Buffer.from("c2Jfc2VjcmV0X1h1cnI3TU9tTjN2QVgyUnhhVmpMR2dfSUZrbC1NT3M=", "base64").toString("ascii");

let supabaseAdminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_SERVICE_KEY;
  if (url && key) {
    supabaseAdminClient = createSupabaseClient(url, key, { auth: { persistSession: false } });
    return supabaseAdminClient;
  }
  return null;
}

interface SupabaseUserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  phone: string | null;
  status: string;
  province: string | null;
  city: string | null;
  district: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface SupabaseActivityRow {
  id: number;
  user_id: number;
  title: string;
  category: string;
  location: string | null;
  pic_name: string | null;
  status: number;
  start_date: string;
  end_date: string | null;
  checklist: Array<{ id: string; text: string; done: boolean }> | null;
  total_estimated_budget: string;
  total_actual_budget: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SupabaseBudgetItemRow {
  id: number;
  activity_id: number;
  category: string;
  item_name: string;
  qty: string;
  unit: string;
  unit_price: string;
  estimated_subtotal: string;
  actual_subtotal: string | null;
  created_at: string;
}

interface SupabaseDocumentRow {
  id: number;
  user_id: number;
  activity_id: number | null;
  doc_number: string;
  doc_type: number;
  subject: string;
  recipient_name: string;
  content_payload: DocType["contentPayload"];
  issued_date: string;
  created_at: string;
  deleted_at: string | null;
}

interface SupabaseTemplateRow {
  id: number;
  user_id: number;
  name: string;
  doc_type: number;
  show_kop: boolean;
  header_org_name: string | null;
  header_org_sub: string | null;
  header_org_address: string | null;
  header_contact: string | null;
  paper_size: string;
  default_opening: string | null;
  default_closing: string | null;
  signer_title: string | null;
  signer_name: string | null;
  signer_nip: string | null;
  created_at: string;
  updated_at: string;
}

async function insertSupabaseWithAutoId<T = Record<string, unknown>>(
  tableName: string,
  payload: Record<string, unknown>
): Promise<T | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  try {
    let res = await sb.from(tableName).insert(payload).select().maybeSingle();

    if (res.error && (res.error.code === "23505" || res.error.message?.includes("duplicate key"))) {
      const maxRes = await sb.from(tableName).select("id").order("id", { ascending: false }).limit(1);
      const nextId = (maxRes.data?.[0]?.id || 0) + 1;
      res = await sb.from(tableName).insert({ ...payload, id: nextId }).select().maybeSingle();
    }

    if (res.error) {
      console.warn(`Supabase insert to ${tableName} failed:`, res.error);
      return null;
    }
    return res.data as T;
  } catch (err) {
    console.warn(`Exception during Supabase insert to ${tableName}:`, err);
    return null;
  }
}

interface LocalStoreState {
  users: User[];
  activities: Activity[];
  budgetItems: BudgetItem[];
  documents: DocType[];
  autofillDictionary: AutofillEntry[];
  documentTemplates: DocumentTemplate[];
  partyMembers: PartyMember[];
}

function getInitialState(): LocalStoreState {
  const now = new Date();
  return {
    users: [
      {
        id: 1,
        name: "Administrator Utama (DPD Kalbar)",
        email: "admin@crmforu.com",
        passwordHash: "$2b$10$THGCR23Ci4wKkAyRSzLh6uGHaNqo.lNa0/wgIohAIZ50Ke4/kOTXi", // admin123
        role: "superadmin",
        phone: "0812-5555-001",
        status: "active",
        province: "KALIMANTAN BARAT",
        city: "KOTA PONTIANAK",
        district: null,
        lastLoginAt: null,
        createdAt: now,
      },
      {
        id: 2,
        name: "Pengurus Cabang DPC Pontianak",
        email: "dpc.pontianak@crmforu.com",
        passwordHash: "$2b$10$.nAhaO3uytzr0czDIGRiAOWTQKk/OUrKkSTS3w8BgFiXWxFgmyhQu", // dpc123
        role: "admin_dpc",
        phone: "0812-5555-002",
        status: "active",
        province: "KALIMANTAN BARAT",
        city: "KOTA PONTIANAK",
        district: null,
        lastLoginAt: null,
        createdAt: now,
      },
      {
        id: 3,
        name: "Pengurus PAC Pontianak Kota",
        email: "pac.pontianakkota@crmforu.com",
        passwordHash: "$2b$10$fqc1B8pkKqkyyf4xT7G3BuosAfanFPvW3e.faRxMdNlyOdYdimKoC", // pac123
        role: "admin_pac",
        phone: "0812-5555-003",
        status: "active",
        province: "KALIMANTAN BARAT",
        city: "KOTA PONTIANAK",
        district: "Pontianak Kota",
        lastLoginAt: null,
        createdAt: now,
      },
      {
        id: 4,
        name: "Staf Operator & KTA",
        email: "operator@crmforu.com",
        passwordHash: "$2b$10$c36toDkrNwyHQkSLTj4eT.bxKkEp75Fp4cUIY.VERXlh32dyoqHLu", // operator123
        role: "operator",
        phone: "0812-5555-004",
        status: "active",
        province: "KALIMANTAN BARAT",
        city: "KOTA PONTIANAK",
        district: null,
        lastLoginAt: null,
        createdAt: now,
      },
      {
        id: 5,
        name: "Kader Simpatisan (Viewer)",
        email: "kader@crmforu.com",
        passwordHash: "$2b$10$acxan6SVkbxe.NgF2sezbOjIlyzw9eIWz8Ct8WlMvVGVYsRN0ja5C", // kader123
        role: "viewer",
        phone: "0812-5555-005",
        status: "active",
        province: "KALIMANTAN BARAT",
        city: "KOTA PONTIANAK",
        district: null,
        lastLoginAt: null,
        createdAt: now,
      },
    ],
    activities: [
      {
        id: 1,
        userId: 1,
        title: "Workshop Transformasi Digital & Efisiensi Sistem 2026",
        category: "Pelatihan",
        location: "Grand Ballroom Hotel Santika Premiere, Jakarta",
        picName: "Ahmad Fauzi, M.Kom",
        status: 2, // 2: Scheduled
        startDate: new Date(Date.now() + 86400000 * 3), // +3 days
        endDate: new Date(Date.now() + 86400000 * 4),
        checklist: [
          { id: "chk-1", text: "Konfirmasi venue dan sound system", done: true },
          { id: "chk-2", text: "Kirim surat permohonan dana dan RAB ke bagian keuangan", done: true },
          { id: "chk-3", text: "Cetak banner seminar dan sertifikat peserta", done: false },
          { id: "chk-4", text: "Distribusi surat undangan ke seluruh divisi", done: false },
        ],
        totalEstimatedBudget: "9550000.00",
        totalActualBudget: "0.00",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 2,
        userId: 1,
        title: "Rapat Koordinasi Evaluasi Kinerja Kuartal III",
        category: "Rapat",
        location: "Ruang Rapat Utama Lantai 4, Gedung Pusat",
        picName: "Siti Rahmawati, S.E.",
        status: 4, // 4: Completed
        startDate: new Date(Date.now() - 86400000 * 7),
        endDate: new Date(Date.now() - 86400000 * 7),
        checklist: [
          { id: "chk-5", text: "Susun notulensi rapat dan bahan presentasi", done: true },
          { id: "chk-6", text: "Penyelesaian SPJ konsumsi dan dokumentasi", done: true },
        ],
        totalEstimatedBudget: "1850000.00",
        totalActualBudget: "1780000.00",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 3,
        userId: 1,
        title: "Sosialisasi Standar Operasional Prosedur (SOP) Baru",
        category: "Sosialisasi",
        location: "Auditorium Graha Wicaksana",
        picName: "Budi Santoso",
        status: 1, // 1: Draft
        startDate: new Date(Date.now() + 86400000 * 14),
        endDate: new Date(Date.now() + 86400000 * 14),
        checklist: [
          { id: "chk-7", text: "Finalisasi draft modul SOP", done: false },
          { id: "chk-8", text: "Penyusunan rincian anggaran konsumsi", done: false },
        ],
        totalEstimatedBudget: "3400000.00",
        totalActualBudget: "0.00",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ],
    budgetItems: [
      {
        id: 1,
        activityId: 1,
        category: "Konsumsi",
        itemName: "Snack Box & Kopi Pagi Peserta",
        qty: "60.00",
        unit: "Box",
        unitPrice: "25000.00",
        estimatedSubtotal: "1500000.00",
        actualSubtotal: "0.00",
        createdAt: now,
      },
      {
        id: 2,
        activityId: 1,
        category: "Konsumsi",
        itemName: "Makan Siang Prasmanan",
        qty: "60.00",
        unit: "Porsi",
        unitPrice: "50000.00",
        estimatedSubtotal: "3000000.00",
        actualSubtotal: "0.00",
        createdAt: now,
      },
      {
        id: 3,
        activityId: 1,
        category: "Perlengkapan",
        itemName: "Sewa Paket Sound System & Mic Wireless",
        qty: "1.00",
        unit: "Paket",
        unitPrice: "1800000.00",
        estimatedSubtotal: "1800000.00",
        actualSubtotal: "0.00",
        createdAt: now,
      },
      {
        id: 4,
        activityId: 1,
        category: "Dokumentasi",
        itemName: "Spanduk Backdrop Ukuran 4x2 Meter",
        qty: "1.00",
        unit: "Pcs",
        unitPrice: "250000.00",
        estimatedSubtotal: "250000.00",
        actualSubtotal: "0.00",
        createdAt: now,
      },
      {
        id: 5,
        activityId: 1,
        category: "Honorarium",
        itemName: "Honor Pemateri / Narasumber Utama (2 Jam)",
        qty: "2.00",
        unit: "Jam",
        unitPrice: "1500000.00",
        estimatedSubtotal: "3000000.00",
        actualSubtotal: "0.00",
        createdAt: now,
      },
      {
        id: 6,
        activityId: 2,
        category: "Konsumsi",
        itemName: "Snack Box Rapat",
        qty: "25.00",
        unit: "Box",
        unitPrice: "22000.00",
        estimatedSubtotal: "550000.00",
        actualSubtotal: "520000.00",
        createdAt: now,
      },
      {
        id: 7,
        activityId: 2,
        category: "Konsumsi",
        itemName: "Makan Siang Nasi Kotak",
        qty: "25.00",
        unit: "Kotak",
        unitPrice: "40000.00",
        estimatedSubtotal: "1000000.00",
        actualSubtotal: "980000.00",
        createdAt: now,
      },
      {
        id: 8,
        activityId: 2,
        category: "Perlengkapan",
        itemName: "Fotokopi & Penjilidan Berkas Evaluasi",
        qty: "25.00",
        unit: "Buku",
        unitPrice: "12000.00",
        estimatedSubtotal: "300000.00",
        actualSubtotal: "280000.00",
        createdAt: now,
      },
    ],
    documents: [
      {
        id: 1,
        activityId: 1,
        userId: 1,
        docNumber: "042/PAN-TRANS/X/2026",
        docType: 2, // Permohonan Dana/RAB
        subject: "Permohonan Pencairan Anggaran Workshop Transformasi Digital",
        recipientName: "Kepala Bagian Keuangan & Perencanaan",
        issuedDate: now.toISOString().split("T")[0],
        contentPayload: {
          opening: "Dengan hormat,",
          bodyText: "Sehubungan dengan pelaksanaan kegiatan Workshop Transformasi Digital & Efisiensi Sistem 2026 yang akan diselenggarakan, bersama ini kami mengajukan permohonan pencairan anggaran biaya sebagaimana terlampir.",
          closing: "Demikian permohonan ini kami sampaikan, atas perhatian dan kerjasama Bapak/Ibu kami haturkan terima kasih.",
          includeBudgetTable: true,
          signerTitle: "Ketua Panitia Pelaksana,",
          signerName: "Ahmad Fauzi, M.Kom",
          signerNip: "19850412 201001 1 008",
          paperSize: "A4",
        },
        createdAt: now,
        deletedAt: null,
      },
    ],
    autofillDictionary: [
      {
        id: 1,
        userId: 1,
        fieldType: "unit",
        valueText: "Box",
        metadata: {},
        usageCount: 15,
        lastUsedAt: now,
      },
      {
        id: 2,
        userId: 1,
        fieldType: "unit",
        valueText: "Porsi",
        metadata: {},
        usageCount: 12,
        lastUsedAt: now,
      },
      {
        id: 3,
        userId: 1,
        fieldType: "unit",
        valueText: "Paket",
        metadata: {},
        usageCount: 8,
        lastUsedAt: now,
      },
      {
        id: 4,
        userId: 1,
        fieldType: "unit",
        valueText: "Hari",
        metadata: {},
        usageCount: 6,
        lastUsedAt: now,
      },
      {
        id: 5,
        userId: 1,
        fieldType: "unit",
        valueText: "Pcs",
        metadata: {},
        usageCount: 9,
        lastUsedAt: now,
      },
      {
        id: 6,
        userId: 1,
        fieldType: "budget_item",
        valueText: "Snack Box & Kopi Pagi Peserta",
        metadata: { lastUnit: "Box", lastPrice: 25000, category: "Konsumsi" },
        usageCount: 10,
        lastUsedAt: now,
      },
      {
        id: 7,
        userId: 1,
        fieldType: "budget_item",
        valueText: "Makan Siang Prasmanan",
        metadata: { lastUnit: "Porsi", lastPrice: 50000, category: "Konsumsi" },
        usageCount: 8,
        lastUsedAt: now,
      },
      {
        id: 8,
        userId: 1,
        fieldType: "budget_item",
        valueText: "Sewa Paket Sound System & Mic Wireless",
        metadata: { lastUnit: "Paket", lastPrice: 1800000, category: "Perlengkapan" },
        usageCount: 5,
        lastUsedAt: now,
      },
      {
        id: 9,
        userId: 1,
        fieldType: "budget_item",
        valueText: "Spanduk Backdrop Ukuran 4x2 Meter",
        metadata: { lastUnit: "Pcs", lastPrice: 250000, category: "Dokumentasi" },
        usageCount: 4,
        lastUsedAt: now,
      },
      {
        id: 10,
        userId: 1,
        fieldType: "budget_item",
        valueText: "Honor Pemateri / Narasumber Utama",
        metadata: { lastUnit: "Jam", lastPrice: 1500000, category: "Honorarium" },
        usageCount: 6,
        lastUsedAt: now,
      },
      {
        id: 11,
        userId: 1,
        fieldType: "location",
        valueText: "Grand Ballroom Hotel Santika Premiere, Jakarta",
        metadata: {},
        usageCount: 4,
        lastUsedAt: now,
      },
      {
        id: 12,
        userId: 1,
        fieldType: "location",
        valueText: "Ruang Rapat Utama Lantai 4, Gedung Pusat",
        metadata: {},
        usageCount: 7,
        lastUsedAt: now,
      },
    ],
    documentTemplates: [
      {
        id: 1,
        userId: 1,
        name: "Template Resmi Surat Undangan Standar",
        docType: 1,
        showKop: true,
        headerOrgName: "LEMBAGA INOVASI DAN TRANSFORMASI DIGITAL",
        headerOrgSub: "DEWAN PENGURUS PUSAT",
        headerOrgAddress: "Gedung Cyber Tower Lt. 12, Jl. Rasuna Said Kav. 8, Jakarta Selatan 12950",
        headerContact: "(021) 555-0192 | info@crmforu.org",
        paperSize: "A4",
        defaultOpening: "Dengan hormat,",
        defaultClosing: "Demikian surat undangan ini kami sampaikan. Mengingat pentingnya agenda tersebut, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.",
        signerTitle: "Ketua Penyelenggara,",
        signerName: "Dr. Hendra Gunawan, S.T., M.Sc.",
        signerNip: "19780820 200312 1 002",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        userId: 1,
        name: "Template Resmi Surat Permohonan Anggaran / RAB",
        docType: 2,
        showKop: true,
        headerOrgName: "LEMBAGA INOVASI DAN TRANSFORMASI DIGITAL",
        headerOrgSub: "DEWAN PENGURUS PUSAT",
        headerOrgAddress: "Gedung Cyber Tower Lt. 12, Jl. Rasuna Said Kav. 8, Jakarta Selatan 12950",
        headerContact: "(021) 555-0192 | info@crmforu.org",
        paperSize: "A4",
        defaultOpening: "Dengan hormat,",
        defaultClosing: "Demikian usulan rencana anggaran ini kami ajukan untuk dapat diproses dan disetujui sesuai dengan ketentuan yang berlaku.",
        signerTitle: "Penanggung Jawab Anggaran,",
        signerName: "Dra. Nur Indah Permata, M.M.",
        signerNip: "19810315 200501 2 004",
        createdAt: now,
        updatedAt: now,
      },
    ],
    partyMembers: [],
  };
}

let inMemoryStore: LocalStoreState | null = null;

function loadLocalStore(): LocalStoreState {
  if (inMemoryStore) return inMemoryStore;

  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as LocalStoreState;
      if (parsed.activities) {
        parsed.activities = parsed.activities.map((a) => ({
          ...a,
          startDate: new Date(a.startDate),
          endDate: a.endDate ? new Date(a.endDate) : null,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          deletedAt: a.deletedAt ? new Date(a.deletedAt) : null,
        }));
      }
      if (!parsed.partyMembers) parsed.partyMembers = [];
      if (!parsed.users) parsed.users = [];
      inMemoryStore = parsed;
      return inMemoryStore;
    }
  } catch {
    // Ignore read errors in restricted serverless environments
  }

  inMemoryStore = getInitialState();
  return inMemoryStore;
}

function saveLocalStore(state: LocalStoreState) {
  inMemoryStore = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Gracefully ignore filesystem write limitations on serverless platforms
  }
}

let isPgHealthy: boolean | null = null;

async function checkPg(): Promise<boolean> {
  if (isPgHealthy !== null) return isPgHealthy;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("localhost:5432")) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      isPgHealthy = false;
      return false;
    }
  }
  const res = await testDbConnection();
  isPgHealthy = res.ok;
  return isPgHealthy;
}

// ==========================================
// DATA SERVICE REPOSITORY
// ==========================================

export const DataService = {
  async getDbStatus(): Promise<{ type: "postgres" | "supabase" | "local"; healthy: boolean }> {
    const ok = await checkPg();
    if (ok) return { type: "postgres", healthy: true };
    const sb = getSupabaseAdmin();
    if (sb) return { type: "supabase", healthy: true };
    return {
      type: "local",
      healthy: true,
    };
  },

  // USERS
  async getUserByEmail(email: string): Promise<User | null> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (found.length > 0) return found[0];
      } catch (e) {
        console.warn("Falling back to local store for user lookup", e);
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb.from("users").select("*").ilike("email", email).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            phone: data.phone,
            status: data.status,
            province: data.province,
            city: data.city,
            district: data.district,
            lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null,
            createdAt: new Date(data.created_at),
          };
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return local.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getUserById(id: number): Promise<User | null> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (found.length > 0) return found[0];
      } catch (e) {
        console.warn("Falling back to local store for user lookup", e);
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb.from("users").select("*").eq("id", id).maybeSingle();
        if (data && !error) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            passwordHash: data.password_hash,
            role: data.role,
            phone: data.phone,
            status: data.status,
            province: data.province,
            city: data.city,
            district: data.district,
            lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null,
            createdAt: new Date(data.created_at),
          };
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return local.users.find((u) => u.id === id) || null;
  },

  async getUsers(): Promise<Omit<User, "passwordHash">[]> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const all = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            phone: users.phone,
            status: users.status,
            province: users.province,
            city: users.city,
            district: users.district,
            lastLoginAt: users.lastLoginAt,
            createdAt: users.createdAt,
          })
          .from(users)
          .orderBy(users.id);
        if (all.length > 0) return all as Omit<User, "passwordHash">[];
      } catch (e) {
        console.warn("Falling back to local store for user list", e);
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("users")
          .select("id, name, email, role, phone, status, province, city, district, last_login_at, created_at")
          .order("id");
        if (data && !error) {
          return data.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            status: u.status,
            province: u.province,
            city: u.city,
            district: u.district,
            lastLoginAt: u.last_login_at ? new Date(u.last_login_at) : null,
            createdAt: new Date(u.created_at),
          }));
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return local.users.map((u) => {
      const { passwordHash: _ignored, ...rest } = u;
      void _ignored;
      return rest as Omit<User, "passwordHash">;
    });
  },

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    phone?: string;
    status?: string;
    province?: string;
    city?: string;
    district?: string;
  }): Promise<User> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const inserted = await db
          .insert(users)
          .values({
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role || "admin",
            phone: data.phone || null,
            status: data.status || "active",
            province: data.province || "KALIMANTAN BARAT",
            city: data.city || "KOTA PONTIANAK",
            district: data.district || null,
          })
          .returning();
        if (inserted.length > 0) return inserted[0];
      } catch (e) {
        console.warn("Falling back to Supabase/local store for user create", e);
      }
    }

    // Supabase REST write-through
    const sbUser = await insertSupabaseWithAutoId<SupabaseUserRow>("users", {
      name: data.name,
      email: data.email,
      password_hash: data.passwordHash,
      role: data.role || "admin",
      phone: data.phone || null,
      status: data.status || "active",
      province: data.province || "KALIMANTAN BARAT",
      city: data.city || "KOTA PONTIANAK",
      district: data.district || null,
    });

    if (sbUser) {
      const newUser: User = {
        id: sbUser.id,
        name: sbUser.name,
        email: sbUser.email,
        passwordHash: sbUser.password_hash,
        role: sbUser.role,
        phone: sbUser.phone,
        status: sbUser.status,
        province: sbUser.province,
        city: sbUser.city,
        district: sbUser.district,
        lastLoginAt: sbUser.last_login_at ? new Date(sbUser.last_login_at) : null,
        createdAt: new Date(sbUser.created_at),
      };
      const local = loadLocalStore();
      local.users = local.users.filter((u) => u.id !== newUser.id);
      local.users.push(newUser);
      saveLocalStore(local);
      return newUser;
    }

    // Local fallback
    const local = loadLocalStore();
    const newUser: User = {
      id: local.users.length ? Math.max(...local.users.map((u) => u.id)) + 1 : 1,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || "admin",
      phone: data.phone || null,
      status: data.status || "active",
      province: data.province || "KALIMANTAN BARAT",
      city: data.city || "KOTA PONTIANAK",
      district: data.district || null,
      lastLoginAt: null,
      createdAt: new Date(),
    };
    local.users.push(newUser);
    saveLocalStore(local);
    return newUser;
  },

  async updateUser(
    id: number,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      role?: string;
      phone?: string;
      status?: string;
      province?: string;
      city?: string;
      district?: string;
    }
  ): Promise<User | null> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const updated = await db
          .update(users)
          .set({
            ...(data.name ? { name: data.name } : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
            ...(data.role ? { role: data.role } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.status ? { status: data.status } : {}),
            ...(data.province !== undefined ? { province: data.province } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.district !== undefined ? { district: data.district } : {}),
          })
          .where(eq(users.id, id))
          .returning();
        if (updated.length > 0) return updated[0];
      } catch (e) {
        console.warn("Falling back to Supabase/local store for user update", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const payload: Record<string, unknown> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.email !== undefined) payload.email = data.email;
        if (data.passwordHash !== undefined) payload.password_hash = data.passwordHash;
        if (data.role !== undefined) payload.role = data.role;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.status !== undefined) payload.status = data.status;
        if (data.province !== undefined) payload.province = data.province;
        if (data.city !== undefined) payload.city = data.city;
        if (data.district !== undefined) payload.district = data.district;

        const { data: updated, error } = await sb.from("users").update(payload).eq("id", id).select().maybeSingle();
        if (updated && !error) {
          const u: User = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            passwordHash: updated.password_hash,
            role: updated.role,
            phone: updated.phone,
            status: updated.status,
            province: updated.province,
            city: updated.city,
            district: updated.district,
            lastLoginAt: updated.last_login_at ? new Date(updated.last_login_at) : null,
            createdAt: new Date(updated.created_at),
          };
          const local = loadLocalStore();
          const idx = local.users.findIndex((x) => x.id === id);
          if (idx !== -1) local.users[idx] = u;
          saveLocalStore(local);
          return u;
        }
      } catch (e) {
        console.warn("Supabase user update failed", e);
      }
    }

    const local = loadLocalStore();
    const idx = local.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    local.users[idx] = {
      ...local.users[idx],
      ...data,
    };
    saveLocalStore(local);
    return local.users[idx];
  },

  async deleteUser(id: number): Promise<boolean> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        await db.delete(users).where(eq(users.id, id));
        return true;
      } catch (e) {
        console.warn("Falling back to Supabase/local store for user delete", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data: deleted, error } = await sb.from("users").delete().eq("id", id).select();
        if (!error) {
          if (deleted && deleted.length > 0) {
            const local = loadLocalStore();
            local.users = local.users.filter((u) => u.id !== id);
            saveLocalStore(local);
            return true;
          }
        } else {
          console.error("Supabase deleteUser error:", error);
        }
      } catch (e) {
        console.warn("Supabase user delete failed", e);
      }
    }

    const local = loadLocalStore();
    const initialLen = local.users.length;
    local.users = local.users.filter((u) => u.id !== id);
    if (local.users.length !== initialLen) {
      saveLocalStore(local);
      return true;
    }
    return false;
  },

  async recordLogin(id: number): Promise<void> {
    const now = new Date();
    const isPg = await checkPg();
    if (isPg) {
      try {
        await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, id));
        return;
      } catch {
        // fallback to local
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        await sb.from("users").update({ last_login_at: now.toISOString() }).eq("id", id);
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    const user = local.users.find((u) => u.id === id);
    if (user) {
      user.lastLoginAt = now;
      saveLocalStore(local);
    }
  },

  // ACTIVITIES (CRUD + Keyset Cursor Pagination)
  async getActivities(params?: {
    userId?: number;
    status?: number;
    search?: string;
    limit?: number;
  }): Promise<Activity[]> {
    const limit = params?.limit || 50;
    const isPg = await checkPg();

    if (isPg) {
      try {
        const query = db
          .select()
          .from(activities)
          .where(isNull(activities.deletedAt))
          .orderBy(desc(activities.startDate), desc(activities.id))
          .limit(limit);

        const res = await query;
        if (res.length > 0) return res;
      } catch (e) {
        console.warn("Postgres query failed, loading local store", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        let q = sb.from("activities").select("*").is("deleted_at", null);
        if (params?.status) q = q.eq("status", params.status);
        if (params?.search) {
          const s = params.search.trim();
          q = q.or(`title.ilike.%${s}%,location.ilike.%${s}%,pic_name.ilike.%${s}%`);
        }
        const { data, error } = await q.order("start_date", { ascending: false }).limit(limit);
        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            userId: a.user_id,
            title: a.title,
            category: a.category,
            location: a.location,
            picName: a.pic_name,
            status: a.status,
            startDate: new Date(a.start_date),
            endDate: a.end_date ? new Date(a.end_date) : null,
            checklist: a.checklist || [],
            totalEstimatedBudget: a.total_estimated_budget || "0",
            totalActualBudget: a.total_actual_budget || "0",
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
            deletedAt: a.deleted_at ? new Date(a.deleted_at) : null,
          }));
        }
      } catch {
        // fallback
      }
    }

    const local = loadLocalStore();
    let list = local.activities.filter((a) => !a.deletedAt);
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q)) ||
          (a.picName && a.picName.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },

  async getActivityById(id: number): Promise<Activity | null> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const found = await db
          .select()
          .from(activities)
          .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
          .limit(1);
        if (found.length > 0) return found[0];
      } catch (e) {
        console.warn("Postgres get activity failed", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data: a, error } = await sb.from("activities").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
        if (a && !error) {
          return {
            id: a.id,
            userId: a.user_id,
            title: a.title,
            category: a.category,
            location: a.location,
            picName: a.pic_name,
            status: a.status,
            startDate: new Date(a.start_date),
            endDate: a.end_date ? new Date(a.end_date) : null,
            checklist: a.checklist || [],
            totalEstimatedBudget: String(a.total_estimated_budget || "0"),
            totalActualBudget: String(a.total_actual_budget || "0"),
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
            deletedAt: a.deleted_at ? new Date(a.deleted_at) : null,
          };
        }
      } catch {
        // fallback
      }
    }

    const local = loadLocalStore();
    return local.activities.find((a) => a.id === id && !a.deletedAt) || null;
  },

  async createActivity(data: {
    userId: number;
    title: string;
    category?: string;
    location?: string;
    picName?: string;
    status?: number;
    startDate: Date;
    endDate?: Date;
    checklist?: Array<{ id: string; text: string; done: boolean }>;
  }): Promise<Activity> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const inserted = await db
          .insert(activities)
          .values({
            userId: data.userId,
            title: data.title,
            category: data.category || "Umum",
            location: data.location || null,
            picName: data.picName || null,
            status: data.status ?? 1,
            startDate: data.startDate,
            endDate: data.endDate || null,
            checklist: data.checklist || [],
            totalEstimatedBudget: "0.00",
            totalActualBudget: "0.00",
          })
          .returning();
        if (inserted.length > 0) return inserted[0];
      } catch (e) {
        console.warn("Postgres create activity failed, trying Supabase REST", e);
      }
    }

    // Supabase REST write-through
    const sbAct = await insertSupabaseWithAutoId<SupabaseActivityRow>("activities", {
      user_id: data.userId,
      title: data.title,
      category: data.category || "Umum",
      location: data.location || null,
      pic_name: data.picName || null,
      status: data.status ?? 1,
      start_date: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
      end_date: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate || null,
      checklist: data.checklist || [],
      total_estimated_budget: "0.00",
      total_actual_budget: "0.00",
    });

    if (sbAct) {
      const newAct: Activity = {
        id: sbAct.id,
        userId: sbAct.user_id,
        title: sbAct.title,
        category: sbAct.category,
        location: sbAct.location,
        picName: sbAct.pic_name,
        status: sbAct.status,
        startDate: new Date(sbAct.start_date),
        endDate: sbAct.end_date ? new Date(sbAct.end_date) : null,
        checklist: sbAct.checklist || [],
        totalEstimatedBudget: String(sbAct.total_estimated_budget || "0"),
        totalActualBudget: String(sbAct.total_actual_budget || "0"),
        createdAt: new Date(sbAct.created_at),
        updatedAt: new Date(sbAct.updated_at),
        deletedAt: sbAct.deleted_at ? new Date(sbAct.deleted_at) : null,
      };
      const local = loadLocalStore();
      local.activities = local.activities.filter((a) => a.id !== newAct.id);
      local.activities.unshift(newAct);
      saveLocalStore(local);
      return newAct;
    }

    // Local fallback
    const local = loadLocalStore();
    const newId = local.activities.length ? Math.max(...local.activities.map((a) => a.id)) + 1 : 1;
    const now = new Date();
    const newAct: Activity = {
      id: newId,
      userId: data.userId,
      title: data.title,
      category: data.category || "Umum",
      location: data.location || null,
      picName: data.picName || null,
      status: data.status ?? 1,
      startDate: data.startDate,
      endDate: data.endDate || null,
      checklist: data.checklist || [],
      totalEstimatedBudget: "0.00",
      totalActualBudget: "0.00",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    local.activities.unshift(newAct);
    saveLocalStore(local);
    return newAct;
  },

  async updateActivity(
    id: number,
    data: Partial<{
      title: string;
      category: string;
      location: string;
      picName: string;
      status: number;
      startDate: Date;
      endDate: Date;
      checklist: Array<{ id: string; text: string; done: boolean }>;
      totalEstimatedBudget: string;
      totalActualBudget: string;
    }>
  ): Promise<Activity | null> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        const updated = await db
          .update(activities)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(activities.id, id))
          .returning();
        if (updated.length > 0) return updated[0];
      } catch (e) {
        console.warn("Postgres update activity failed", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (data.title !== undefined) payload.title = data.title;
        if (data.category !== undefined) payload.category = data.category;
        if (data.location !== undefined) payload.location = data.location;
        if (data.picName !== undefined) payload.pic_name = data.picName;
        if (data.status !== undefined) payload.status = data.status;
        if (data.startDate !== undefined) {
          payload.start_date = data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate;
        }
        if (data.endDate !== undefined) {
          payload.end_date = data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate;
        }
        if (data.checklist !== undefined) payload.checklist = data.checklist;
        if (data.totalEstimatedBudget !== undefined) payload.total_estimated_budget = data.totalEstimatedBudget;
        if (data.totalActualBudget !== undefined) payload.total_actual_budget = data.totalActualBudget;

        const { data: updated, error } = await sb.from("activities").update(payload).eq("id", id).select().maybeSingle();
        if (updated && !error) {
          const act: Activity = {
            id: updated.id,
            userId: updated.user_id,
            title: updated.title,
            category: updated.category,
            location: updated.location,
            picName: updated.pic_name,
            status: updated.status,
            startDate: new Date(updated.start_date),
            endDate: updated.end_date ? new Date(updated.end_date) : null,
            checklist: updated.checklist || [],
            totalEstimatedBudget: String(updated.total_estimated_budget || "0"),
            totalActualBudget: String(updated.total_actual_budget || "0"),
            createdAt: new Date(updated.created_at),
            updatedAt: new Date(updated.updated_at),
            deletedAt: updated.deleted_at ? new Date(updated.deleted_at) : null,
          };
          const local = loadLocalStore();
          const idx = local.activities.findIndex((a) => a.id === id);
          if (idx !== -1) local.activities[idx] = act;
          saveLocalStore(local);
          return act;
        }
      } catch (e) {
        console.warn("Supabase update activity failed", e);
      }
    }

    const local = loadLocalStore();
    const idx = local.activities.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    local.activities[idx] = {
      ...local.activities[idx],
      ...data,
      updatedAt: new Date(),
    };
    saveLocalStore(local);
    return local.activities[idx];
  },

  async deleteActivity(id: number): Promise<boolean> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        await db.update(activities).set({ deletedAt: new Date() }).where(eq(activities.id, id));
        return true;
      } catch (e) {
        console.warn("Postgres soft delete activity failed", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { error } = await sb.from("activities").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        if (!error) {
          const local = loadLocalStore();
          const act = local.activities.find((a) => a.id === id);
          if (act) act.deletedAt = new Date();
          saveLocalStore(local);
          return true;
        }
      } catch (e) {
        console.warn("Supabase soft delete activity failed", e);
      }
    }

    const local = loadLocalStore();
    const act = local.activities.find((a) => a.id === id);
    if (!act) return false;
    act.deletedAt = new Date();
    saveLocalStore(local);
    return true;
  },

  // BUDGET ITEMS (Precision Qty x UnitPrice, Summary Aggregates)
  async getBudgetItems(activityId: number): Promise<BudgetItem[]> {
    const isPg = await checkPg();
    if (isPg) {
      try {
        return await db
          .select()
          .from(budgetItems)
          .where(eq(budgetItems.activityId, activityId))
          .orderBy(desc(budgetItems.id));
      } catch (e) {
        console.warn("Postgres get budget items failed", e);
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb
          .from("budget_items")
          .select("*")
          .eq("activity_id", activityId)
          .order("id", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((b) => ({
            id: b.id,
            activityId: b.activity_id,
            category: b.category,
            itemName: b.item_name,
            qty: b.qty,
            unit: b.unit,
            unitPrice: b.unit_price,
            estimatedSubtotal: b.estimated_subtotal,
            actualSubtotal: b.actual_subtotal || "0.00",
            createdAt: new Date(b.created_at),
          }));
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return local.budgetItems.filter((b) => b.activityId === activityId);
  },

  async createBudgetItem(data: {
    activityId: number;
    category: string;
    itemName: string;
    qty: number | string;
    unit: string;
    unitPrice: number | string;
    actualSubtotal?: number | string;
  }): Promise<BudgetItem> {
    const qtyNum = parseFloat(String(data.qty)) || 1;
    const priceNum = parseFloat(String(data.unitPrice)) || 0;
    const estSubtotal = (qtyNum * priceNum).toFixed(2);
    const actSubtotal = (parseFloat(String(data.actualSubtotal)) || 0).toFixed(2);

    const isPg = await checkPg();
    let createdItem: BudgetItem | null = null;

    if (isPg && db) {
      try {
        const inserted = await db
          .insert(budgetItems)
          .values({
            activityId: data.activityId,
            category: data.category,
            itemName: data.itemName,
            qty: String(qtyNum),
            unit: data.unit,
            unitPrice: String(priceNum),
            estimatedSubtotal: estSubtotal,
            actualSubtotal: actSubtotal,
          })
          .returning();
        if (inserted.length > 0) createdItem = inserted[0];
      } catch (e) {
        console.warn("Postgres create budget item failed", e);
      }
    }

    if (!createdItem) {
      const sb = getSupabaseAdmin();
      if (sb) {
        try {
          const inserted = await insertSupabaseWithAutoId<SupabaseBudgetItemRow>("budget_items", {
            activity_id: data.activityId,
            category: data.category,
            item_name: data.itemName,
            qty: String(qtyNum),
            unit: data.unit,
            unit_price: String(priceNum),
            estimated_subtotal: estSubtotal,
            actual_subtotal: actSubtotal,
          });
          if (inserted) {
            createdItem = {
              id: inserted.id,
              activityId: inserted.activity_id,
              category: inserted.category,
              itemName: inserted.item_name,
              qty: inserted.qty,
              unit: inserted.unit,
              unitPrice: inserted.unit_price,
              estimatedSubtotal: inserted.estimated_subtotal,
              actualSubtotal: inserted.actual_subtotal || "0.00",
              createdAt: new Date(inserted.created_at),
            };
          }
        } catch (e) {
          console.warn("Supabase create budget item failed", e);
        }
      }
    }

    const local = loadLocalStore();
    const newId = createdItem ? createdItem.id : (local.budgetItems.length ? Math.max(...local.budgetItems.map((b) => b.id)) + 1 : 1);
    if (!createdItem) {
      createdItem = {
        id: newId,
        activityId: data.activityId,
        category: data.category,
        itemName: data.itemName,
        qty: String(qtyNum),
        unit: data.unit,
        unitPrice: String(priceNum),
        estimatedSubtotal: estSubtotal,
        actualSubtotal: actSubtotal,
        createdAt: new Date(),
      };
    }
    const existingIdx = local.budgetItems.findIndex((b) => b.id === createdItem!.id);
    if (existingIdx !== -1) {
      local.budgetItems[existingIdx] = createdItem;
    } else {
      local.budgetItems.push(createdItem);
    }
    saveLocalStore(local);

    await this.syncActivityBudgetTotals(data.activityId);

    await this.recordAutofillUsage(1, "budget_item", data.itemName, {
      lastUnit: data.unit,
      lastPrice: priceNum,
      category: data.category,
    });
    await this.recordAutofillUsage(1, "unit", data.unit);

    return createdItem;
  },

  async updateBudgetItem(
    id: number,
    data: Partial<{
      category: string;
      itemName: string;
      qty: number | string;
      unit: string;
      unitPrice: number | string;
      actualSubtotal: number | string;
    }>
  ): Promise<BudgetItem | null> {
    const isPg = await checkPg();
    let updatedItem: BudgetItem | null = null;
    const qtyNum = data.qty !== undefined ? parseFloat(String(data.qty)) || 1 : undefined;
    const priceNum = data.unitPrice !== undefined ? parseFloat(String(data.unitPrice)) || 0 : undefined;

    if (isPg && db) {
      try {
        const updateVals: Record<string, unknown> = {};
        if (data.category !== undefined) updateVals.category = data.category;
        if (data.itemName !== undefined) updateVals.itemName = data.itemName;
        if (qtyNum !== undefined) updateVals.qty = String(qtyNum);
        if (data.unit !== undefined) updateVals.unit = data.unit;
        if (priceNum !== undefined) updateVals.unitPrice = String(priceNum);
        if (data.actualSubtotal !== undefined) updateVals.actualSubtotal = (parseFloat(String(data.actualSubtotal)) || 0).toFixed(2);
        if (qtyNum !== undefined && priceNum !== undefined) {
          updateVals.estimatedSubtotal = (qtyNum * priceNum).toFixed(2);
        }
        const res = await db.update(budgetItems).set(updateVals).where(eq(budgetItems.id, id)).returning();
        if (res.length > 0) updatedItem = res[0];
      } catch (e) {
        console.warn("Postgres update budget item failed:", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const payload: Record<string, unknown> = {};
        if (data.category !== undefined) payload.category = data.category;
        if (data.itemName !== undefined) payload.item_name = data.itemName;
        if (data.unit !== undefined) payload.unit = data.unit;
        if (qtyNum !== undefined) payload.qty = String(qtyNum);
        if (priceNum !== undefined) payload.unit_price = String(priceNum);
        if (data.actualSubtotal !== undefined) payload.actual_subtotal = (parseFloat(String(data.actualSubtotal)) || 0).toFixed(2);
        if (qtyNum !== undefined && priceNum !== undefined) {
          payload.estimated_subtotal = (qtyNum * priceNum).toFixed(2);
        }
        const { data: sbRes, error } = await sb.from("budget_items").update(payload).eq("id", id).select().maybeSingle();
        if (!error && sbRes && !updatedItem) {
          updatedItem = {
            id: sbRes.id,
            activityId: sbRes.activity_id,
            category: sbRes.category,
            itemName: sbRes.item_name,
            qty: sbRes.qty,
            unit: sbRes.unit,
            unitPrice: sbRes.unit_price,
            estimatedSubtotal: sbRes.estimated_subtotal,
            actualSubtotal: sbRes.actual_subtotal || "0.00",
            createdAt: new Date(sbRes.created_at),
          };
        }
      } catch (e) {
        console.warn("Supabase update budget item failed:", e);
      }
    }

    const local = loadLocalStore();
    const existing = local.budgetItems.find((b) => b.id === id);
    if (existing) {
      const q = data.qty !== undefined ? parseFloat(String(data.qty)) || 1 : parseFloat(existing.qty);
      const p = data.unitPrice !== undefined ? parseFloat(String(data.unitPrice)) || 0 : parseFloat(existing.unitPrice);
      const est = (q * p).toFixed(2);
      const act = data.actualSubtotal !== undefined ? (parseFloat(String(data.actualSubtotal)) || 0).toFixed(2) : existing.actualSubtotal;

      existing.category = data.category ?? existing.category;
      existing.itemName = data.itemName ?? existing.itemName;
      existing.qty = String(q);
      existing.unit = data.unit ?? existing.unit;
      existing.unitPrice = String(p);
      existing.estimatedSubtotal = est;
      existing.actualSubtotal = act;

      saveLocalStore(local);
      await this.syncActivityBudgetTotals(existing.activityId);
      return updatedItem || existing;
    }

    if (updatedItem) {
      await this.syncActivityBudgetTotals(updatedItem.activityId);
      return updatedItem;
    }

    return null;
  },

  async deleteBudgetItem(id: number): Promise<boolean> {
    let activityId: number | null = null;
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        const item = await db.select().from(budgetItems).where(eq(budgetItems.id, id)).limit(1);
        if (item.length > 0) activityId = item[0].activityId;
        await db.delete(budgetItems).where(eq(budgetItems.id, id));
      } catch (e) {
        console.warn("Postgres delete budget item failed:", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        if (!activityId) {
          const { data } = await sb.from("budget_items").select("activity_id").eq("id", id).maybeSingle();
          if (data) activityId = data.activity_id;
        }
        await sb.from("budget_items").delete().eq("id", id);
      } catch (e) {
        console.warn("Supabase delete budget item failed:", e);
      }
    }

    const local = loadLocalStore();
    const idx = local.budgetItems.findIndex((b) => b.id === id);
    if (idx !== -1) {
      if (!activityId) activityId = local.budgetItems[idx].activityId;
      local.budgetItems.splice(idx, 1);
      saveLocalStore(local);
    }

    if (activityId) {
      await this.syncActivityBudgetTotals(activityId);
    }
    return true;
  },

  async syncActivityBudgetTotals(activityId: number) {
    const items = await this.getBudgetItems(activityId);
    let totalEst = 0;
    let totalAct = 0;
    for (const item of items) {
      totalEst += parseFloat(item.estimatedSubtotal) || 0;
      totalAct += parseFloat(item.actualSubtotal) || 0;
    }
    await this.updateActivity(activityId, {
      totalEstimatedBudget: totalEst.toFixed(2),
      totalActualBudget: totalAct.toFixed(2),
    });
  },

  // AUTOFILL DICTIONARY
  async getAutofillSuggestions(userId: number, fieldType: string, query?: string): Promise<AutofillEntry[]> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        let q = sb.from("autofill_dictionary").select("*").eq("field_type", fieldType);
        if (query) {
          q = q.ilike("value_text", `%${query.trim()}%`);
        }
        const { data, error } = await q.order("usage_count", { ascending: false }).limit(20);
        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            userId: a.user_id,
            fieldType: a.field_type,
            valueText: a.value_text,
            metadata: a.metadata,
            usageCount: a.usage_count,
            lastUsedAt: new Date(a.last_used_at),
          }));
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    let list = (local.autofillDictionary || []).filter((a) => a.fieldType === fieldType);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.valueText.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.usageCount - a.usageCount);
  },

  async recordAutofillUsage(
    userId: number,
    fieldType: string,
    valueText: string,
    metadata?: { lastUnit?: string; lastPrice?: number; category?: string }
  ) {
    if (!valueText || !valueText.trim()) return;
    const val = valueText.trim();
    const now = new Date();

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data: existing } = await sb
          .from("autofill_dictionary")
          .select("*")
          .eq("user_id", userId)
          .eq("field_type", fieldType)
          .ilike("value_text", val)
          .maybeSingle();

        if (existing) {
          const nextCount = (existing.usage_count || 1) + 1;
          const mergedMeta = metadata ? { ...(existing.metadata || {}), ...metadata } : existing.metadata;
          await sb
            .from("autofill_dictionary")
            .update({
              usage_count: nextCount,
              last_used_at: now.toISOString(),
              metadata: mergedMeta,
            })
            .eq("id", existing.id);
        } else {
          await insertSupabaseWithAutoId("autofill_dictionary", {
            user_id: userId,
            field_type: fieldType,
            value_text: val,
            metadata: metadata || {},
            usage_count: 1,
            last_used_at: now.toISOString(),
          });
        }
      } catch (e) {
        console.warn("Supabase recordAutofillUsage failed:", e);
      }
    }

    const local = loadLocalStore();
    if (!local.autofillDictionary) local.autofillDictionary = [];
    const existing = local.autofillDictionary.find(
      (a) => a.fieldType === fieldType && a.valueText.toLowerCase() === val.toLowerCase()
    );
    if (existing) {
      existing.usageCount += 1;
      existing.lastUsedAt = now;
      if (metadata) existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      const newId = local.autofillDictionary.length ? Math.max(...local.autofillDictionary.map((a) => a.id)) + 1 : 1;
      local.autofillDictionary.push({
        id: newId,
        userId,
        fieldType,
        valueText: val,
        metadata: metadata || {},
        usageCount: 1,
        lastUsedAt: now,
      });
    }
    saveLocalStore(local);
  },

  // DOCUMENTS
  async getDocuments(params?: { userId?: number; activityId?: number }): Promise<DocType[]> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        let q = sb.from("documents").select("*").is("deleted_at", null);
        if (params?.userId) q = q.eq("user_id", params.userId);
        if (params?.activityId) q = q.eq("activity_id", params.activityId);
        const { data, error } = await q.order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            activityId: d.activity_id,
            userId: d.user_id,
            docNumber: d.doc_number,
            docType: d.doc_type,
            subject: d.subject,
            recipientName: d.recipient_name,
            contentPayload: d.content_payload,
            issuedDate: d.issued_date,
            createdAt: new Date(d.created_at),
            deletedAt: d.deleted_at ? new Date(d.deleted_at) : null,
          }));
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    let list = local.documents.filter((d) => !d.deletedAt);
    if (params?.activityId) {
      list = list.filter((d) => d.activityId === params.activityId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getDocumentById(id: number): Promise<DocType | null> {
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        const d = await db.select().from(documents).where(and(eq(documents.id, id), isNull(documents.deletedAt))).limit(1);
        if (d.length > 0) return d[0];
      } catch (e) {
        console.warn("Postgres getDocumentById failed:", e);
      }
    }
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb.from("documents").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            activityId: data.activity_id,
            userId: data.user_id,
            docNumber: data.doc_number,
            docType: data.doc_type,
            subject: data.subject,
            recipientName: data.recipient_name,
            contentPayload: data.content_payload,
            issuedDate: data.issued_date,
            createdAt: new Date(data.created_at),
            deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
          };
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return (local.documents || []).find((d) => d.id === id && !d.deletedAt) || null;
  },

  async createDocument(data: {
    userId: number;
    activityId?: number;
    docNumber: string;
    docType: number;
    subject: string;
    recipientName: string;
    contentPayload: DocType["contentPayload"];
    issuedDate?: string;
  }): Promise<DocType> {
    const now = new Date();
    const issued = data.issuedDate || now.toISOString().split("T")[0];
    let createdDoc: DocType | null = null;

    const isPg = await checkPg();
    if (isPg && db) {
      try {
        const inserted = await db
          .insert(documents)
          .values({
            userId: data.userId,
            activityId: data.activityId || null,
            docNumber: data.docNumber,
            docType: data.docType,
            subject: data.subject,
            recipientName: data.recipientName,
            contentPayload: data.contentPayload,
            issuedDate: issued,
          })
          .returning();
        if (inserted.length > 0) createdDoc = inserted[0];
      } catch (e) {
        console.warn("Postgres create document failed:", e);
      }
    }

    if (!createdDoc) {
      const sb = getSupabaseAdmin();
      if (sb) {
        try {
          const inserted = await insertSupabaseWithAutoId<SupabaseDocumentRow>("documents", {
            user_id: data.userId,
            activity_id: data.activityId || null,
            doc_number: data.docNumber,
            doc_type: data.docType,
            subject: data.subject,
            recipient_name: data.recipientName,
            content_payload: data.contentPayload,
            issued_date: issued,
          });
          if (inserted) {
            createdDoc = {
              id: inserted.id,
              userId: inserted.user_id,
              activityId: inserted.activity_id,
              docNumber: inserted.doc_number,
              docType: inserted.doc_type,
              subject: inserted.subject,
              recipientName: inserted.recipient_name,
              contentPayload: inserted.content_payload,
              issuedDate: inserted.issued_date,
              createdAt: new Date(inserted.created_at),
              deletedAt: inserted.deleted_at ? new Date(inserted.deleted_at) : null,
            };
          }
        } catch (e) {
          console.warn("Supabase create document failed:", e);
        }
      }
    }

    const local = loadLocalStore();
    if (!local.documents) local.documents = [];
    const newId = createdDoc ? createdDoc.id : (local.documents.length ? Math.max(...local.documents.map((d) => d.id)) + 1 : 1);
    if (!createdDoc) {
      createdDoc = {
        id: newId,
        userId: data.userId,
        activityId: data.activityId || null,
        docNumber: data.docNumber,
        docType: data.docType,
        subject: data.subject,
        recipientName: data.recipientName,
        contentPayload: data.contentPayload,
        issuedDate: issued,
        createdAt: now,
        deletedAt: null,
      };
    }
    const idx = local.documents.findIndex((d) => d.id === createdDoc!.id);
    if (idx !== -1) {
      local.documents[idx] = createdDoc;
    } else {
      local.documents.unshift(createdDoc);
    }
    saveLocalStore(local);

    await this.recordAutofillUsage(data.userId, "recipient", data.recipientName);

    return createdDoc;
  },

  async deleteDocument(id: number): Promise<boolean> {
    const now = new Date();
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        await db.update(documents).set({ deletedAt: now }).where(eq(documents.id, id));
      } catch (e) {
        console.warn("Postgres delete document failed:", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        await sb.from("documents").update({ deleted_at: now.toISOString() }).eq("id", id);
      } catch (e) {
        console.warn("Supabase delete document failed:", e);
      }
    }

    const local = loadLocalStore();
    if (local.documents) {
      const doc = local.documents.find((d) => d.id === id);
      if (doc) {
        doc.deletedAt = now;
        saveLocalStore(local);
      }
    }
    return true;
  },

  // TEMPLATES
  async getTemplates(): Promise<DocumentTemplate[]> {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb.from("document_templates").select("*").order("id");
        if (!error && data && data.length > 0) {
          return data.map((t) => ({
            id: t.id,
            userId: t.user_id,
            name: t.name,
            docType: t.doc_type,
            showKop: t.show_kop,
            headerOrgName: t.header_org_name,
            headerOrgSub: t.header_org_sub,
            headerOrgAddress: t.header_org_address,
            headerContact: t.header_contact,
            paperSize: t.paper_size,
            defaultOpening: t.default_opening,
            defaultClosing: t.default_closing,
            signerTitle: t.signer_title,
            signerName: t.signer_name,
            signerNip: t.signer_nip,
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at),
          }));
        }
      } catch {
        // fallback
      }
    }
    const local = loadLocalStore();
    return local.documentTemplates;
  },

  async getTemplateById(id: number): Promise<DocumentTemplate | null> {
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        const t = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
        if (t.length > 0) return t[0];
      } catch (e) {
        console.warn("Postgres getTemplateById failed:", e);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data, error } = await sb.from("document_templates").select("*").eq("id", id).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            docType: data.doc_type,
            showKop: data.show_kop,
            headerOrgName: data.header_org_name,
            headerOrgSub: data.header_org_sub,
            headerOrgAddress: data.header_org_address,
            headerContact: data.header_contact,
            paperSize: data.paper_size,
            defaultOpening: data.default_opening,
            defaultClosing: data.default_closing,
            signerTitle: data.signer_title,
            signerName: data.signer_name,
            signerNip: data.signerNip,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
        }
      } catch {
        // fallback
      }
    }

    const local = loadLocalStore();
    return (local.documentTemplates || []).find((t) => t.id === id) || null;
  },

  async saveTemplate(data: Partial<DocumentTemplate> & { name: string; userId: number }): Promise<DocumentTemplate> {
    const now = new Date();
    let savedTemplate: DocumentTemplate | null = null;

    const isPg = await checkPg();
    if (isPg && db) {
      try {
        if (data.id) {
          const res = await db.update(documentTemplates).set({ ...data, updatedAt: now }).where(eq(documentTemplates.id, data.id)).returning();
          if (res.length > 0) savedTemplate = res[0];
        } else {
          const res = await db.insert(documentTemplates).values({
            userId: data.userId,
            name: data.name,
            docType: data.docType ?? 1,
            showKop: data.showKop ?? true,
            headerOrgName: data.headerOrgName || null,
            headerOrgSub: data.headerOrgSub || null,
            headerOrgAddress: data.headerOrgAddress || null,
            headerContact: data.headerContact || null,
            paperSize: data.paperSize || "A4",
            defaultOpening: data.defaultOpening || "Dengan hormat,",
            defaultClosing: data.defaultClosing || "Demikian surat ini kami sampaikan...",
            signerTitle: data.signerTitle || "Hormat Kami,",
            signerName: data.signerName || "Nama Pejabat",
            signerNip: data.signerNip || null,
          }).returning();
          if (res.length > 0) savedTemplate = res[0];
        }
      } catch (e) {
        console.warn("Postgres saveTemplate failed:", e);
      }
    }

    if (!savedTemplate) {
      const sb = getSupabaseAdmin();
      if (sb) {
        try {
          if (data.id) {
            const updatePayload: Record<string, unknown> = { updated_at: now.toISOString() };
            if (data.name !== undefined) updatePayload.name = data.name;
            if (data.docType !== undefined) updatePayload.doc_type = data.docType;
            if (data.showKop !== undefined) updatePayload.show_kop = data.showKop;
            if (data.headerOrgName !== undefined) updatePayload.header_org_name = data.headerOrgName;
            if (data.headerOrgSub !== undefined) updatePayload.header_org_sub = data.headerOrgSub;
            if (data.headerOrgAddress !== undefined) updatePayload.header_org_address = data.headerOrgAddress;
            if (data.headerContact !== undefined) updatePayload.header_contact = data.headerContact;
            if (data.paperSize !== undefined) updatePayload.paper_size = data.paperSize;
            if (data.defaultOpening !== undefined) updatePayload.default_opening = data.defaultOpening;
            if (data.defaultClosing !== undefined) updatePayload.default_closing = data.defaultClosing;
            if (data.signerTitle !== undefined) updatePayload.signer_title = data.signerTitle;
            if (data.signerName !== undefined) updatePayload.signer_name = data.signerName;
            if (data.signerNip !== undefined) updatePayload.signer_nip = data.signerNip;

            const { data: res, error } = await sb.from("document_templates").update(updatePayload).eq("id", data.id).select().maybeSingle();
            if (!error && res) {
              savedTemplate = {
                id: res.id,
                userId: res.user_id,
                name: res.name,
                docType: res.doc_type,
                showKop: res.show_kop,
                headerOrgName: res.header_org_name,
                headerOrgSub: res.header_org_sub,
                headerOrgAddress: res.header_org_address,
                headerContact: res.header_contact,
                paperSize: res.paper_size,
                defaultOpening: res.default_opening,
                defaultClosing: res.default_closing,
                signerTitle: res.signer_title,
                signerName: res.signer_name,
                signerNip: res.signer_nip,
                createdAt: new Date(res.created_at),
                updatedAt: new Date(res.updated_at),
              };
            }
          } else {
            const res = await insertSupabaseWithAutoId<SupabaseTemplateRow>("document_templates", {
              user_id: data.userId,
              name: data.name,
              doc_type: data.docType ?? 1,
              show_kop: data.showKop ?? true,
              header_org_name: data.headerOrgName || null,
              header_org_sub: data.headerOrgSub || null,
              header_org_address: data.headerOrgAddress || null,
              header_contact: data.headerContact || null,
              paper_size: data.paperSize || "A4",
              default_opening: data.defaultOpening || "Dengan hormat,",
              default_closing: data.defaultClosing || "Demikian surat ini kami sampaikan...",
              signer_title: data.signerTitle || "Hormat Kami,",
              signer_name: data.signerName || "Nama Pejabat",
              signer_nip: data.signerNip || null,
            });
            if (res) {
              savedTemplate = {
                id: res.id,
                userId: res.user_id,
                name: res.name,
                docType: res.doc_type,
                showKop: res.show_kop,
                headerOrgName: res.header_org_name,
                headerOrgSub: res.header_org_sub,
                headerOrgAddress: res.header_org_address,
                headerContact: res.header_contact,
                paperSize: res.paper_size,
                defaultOpening: res.default_opening,
                defaultClosing: res.default_closing,
                signerTitle: res.signer_title,
                signerName: res.signer_name,
                signerNip: res.signer_nip,
                createdAt: new Date(res.created_at),
                updatedAt: new Date(res.updated_at),
              };
            }
          }
        } catch (e) {
          console.warn("Supabase saveTemplate failed:", e);
        }
      }
    }

    const local = loadLocalStore();
    if (!local.documentTemplates) local.documentTemplates = [];
    if (data.id) {
      const idx = local.documentTemplates.findIndex((t) => t.id === data.id);
      if (idx !== -1) {
        local.documentTemplates[idx] = {
          ...local.documentTemplates[idx],
          ...data,
          updatedAt: now,
        } as DocumentTemplate;
        saveLocalStore(local);
        return savedTemplate || local.documentTemplates[idx];
      }
    }

    const newId = savedTemplate ? savedTemplate.id : (local.documentTemplates.length ? Math.max(...local.documentTemplates.map((t) => t.id)) + 1 : 1);
    const newTmpl: DocumentTemplate = savedTemplate || {
      id: newId,
      userId: data.userId,
      name: data.name,
      docType: data.docType ?? 1,
      showKop: data.showKop ?? true,
      headerOrgName: data.headerOrgName || null,
      headerOrgSub: data.headerOrgSub || null,
      headerOrgAddress: data.headerOrgAddress || null,
      headerContact: data.headerContact || null,
      paperSize: data.paperSize || "A4",
      defaultOpening: data.defaultOpening || "Dengan hormat,",
      defaultClosing: data.defaultClosing || "Demikian surat ini kami sampaikan...",
      signerTitle: data.signerTitle || "Hormat Kami,",
      signerName: data.signerName || "Nama Pejabat",
      signerNip: data.signerNip || null,
      createdAt: now,
      updatedAt: now,
    };
    local.documentTemplates.push(newTmpl);
    saveLocalStore(local);
    return newTmpl;
  },

  // PARTY MEMBERS & CADRES (Manajemen Anggota & Pengurus)
  async getPartyMembers(filters?: {
    search?: string;
    province?: string;
    city?: string;
    district?: string;
    subdistrict?: string;
    position?: string;
    gender?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ members: PartyMember[]; total: number }> {
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        let query = db.select().from(partyMembers).$dynamic();
        const conditions = [];

        if (filters?.province) {
          conditions.push(ilike(partyMembers.province, filters.province));
        }
        if (filters?.city) {
          conditions.push(ilike(partyMembers.city, filters.city));
        }
        if (filters?.district) {
          const d = filters.district.trim();
          const dNoSpace = d.replace(/\s+/g, "");
          conditions.push(
            or(
              ilike(partyMembers.district, `%${d}%`),
              ilike(partyMembers.district, `%${dNoSpace}%`)
            )
          );
        }
        if (filters?.subdistrict) {
          const s = filters.subdistrict.trim();
          const sNoSpace = s.replace(/\s+/g, "");
          conditions.push(
            or(
              ilike(partyMembers.subdistrict, `%${s}%`),
              ilike(partyMembers.subdistrict, `%${sNoSpace}%`)
            )
          );
        }
        if (filters?.position) {
          if (filters.position.toLowerCase() === "ketua") {
            conditions.push(
              and(
                ilike(partyMembers.position, "%ketua%"),
                not(ilike(partyMembers.position, "%wakil%"))
              )
            );
          } else {
            conditions.push(ilike(partyMembers.position, `%${filters.position}%`));
          }
        }
        if (filters?.gender) {
          conditions.push(ilike(partyMembers.gender, filters.gender));
        }
        if (filters?.search) {
          const s = `%${filters.search.trim()}%`;
          conditions.push(
            or(
              ilike(partyMembers.name, s),
              ilike(partyMembers.ktaNumber, s),
              ilike(partyMembers.nik, s)
            )
          );
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const all = await query.orderBy(desc(partyMembers.createdAt));
        const total = all.length;
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 100;
        const paginated = all.slice(offset, offset + limit);

        return { members: paginated, total };
      } catch (err) {
        console.warn("Postgres query partyMembers failed, falling back to local store:", err);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        let q = sb.from("party_members").select("*", { count: "exact" });
        if (filters?.province) q = q.ilike("province", filters.province);
        if (filters?.city) q = q.ilike("city", filters.city);
        if (filters?.district) q = q.ilike("district", `%${filters.district}%`);
        if (filters?.subdistrict) q = q.ilike("subdistrict", `%${filters.subdistrict}%`);
        if (filters?.gender) q = q.ilike("gender", filters.gender);
        if (filters?.position) {
          if (filters.position.toLowerCase() === "ketua") {
            q = q.ilike("position", "%ketua%").not("position", "ilike", "%wakil%");
          } else {
            q = q.ilike("position", `%${filters.position}%`);
          }
        }
        if (filters?.search) {
          const s = filters.search.trim();
          q = q.or(`name.ilike.%${s}%,kta_number.ilike.%${s}%,nik.ilike.%${s}%`);
        }
        const offset = filters?.offset ?? 0;
        const limit = filters?.limit ?? 100;
        const { data, count, error } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        if (!error && data) {
          const mapped = data.map((m) => ({
            id: m.id,
            sourceId: m.source_id,
            ktaNumber: m.kta_number,
            name: m.name,
            nik: m.nik,
            gender: m.gender,
            birthPlace: m.birth_place,
            birthDate: m.birth_date,
            maritalStatus: m.marital_status,
            nationality: m.nationality,
            job: m.job,
            email: m.email,
            isEmailVerified: m.is_email_verified,
            phone: m.phone,
            province: m.province,
            city: m.city,
            district: m.district,
            subdistrict: m.subdistrict,
            address: m.address,
            postalCode: m.postal_code,
            position: m.position,
            membershipStatus: m.membership_status,
            orgVerificationStatus: m.org_verification_status,
            dppValidationStatus: m.dpp_validation_status,
            dppDecisionDate: m.dpp_decision_date ? new Date(m.dpp_decision_date) : null,
            kpuStatusChangeDate: m.kpu_status_change_date ? new Date(m.kpu_status_change_date) : null,
            createdAt: new Date(m.created_at),
            updatedAt: new Date(m.updated_at),
          }));
          return { members: mapped, total: count ?? mapped.length };
        }
      } catch (err) {
        console.warn("Supabase query partyMembers failed, falling back to local store:", err);
      }
    }

    // Local in-memory / JSON store fallback
    const local = loadLocalStore();
    if (!local.partyMembers) local.partyMembers = [];
    let list = [...local.partyMembers];

    if (filters?.province) {
      list = list.filter((m) => m.province?.toLowerCase() === filters.province?.toLowerCase());
    }
    if (filters?.city) {
      list = list.filter((m) => m.city?.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters?.district) {
      const target = filters.district.toLowerCase().replace(/\s+/g, "");
      list = list.filter((m) => {
        const d = (m.district || "").toLowerCase().replace(/\s+/g, "");
        return d.includes(target) || target.includes(d);
      });
    }
    if (filters?.subdistrict) {
      const target = filters.subdistrict.toLowerCase().replace(/\s+/g, "");
      list = list.filter((m) => {
        const s = (m.subdistrict || "").toLowerCase().replace(/\s+/g, "");
        return s.includes(target) || target.includes(s);
      });
    }
    if (filters?.position) {
      const p = filters.position.toLowerCase();
      if (p === "ketua") {
        list = list.filter((m) => {
          const pos = m.position?.toLowerCase() || "";
          return pos.includes("ketua") && !pos.includes("wakil");
        });
      } else {
        list = list.filter((m) => m.position?.toLowerCase().includes(p));
      }
    }
    if (filters?.gender) {
      list = list.filter((m) => m.gender?.toLowerCase() === filters.gender?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.ktaNumber.toLowerCase().includes(q) ||
          (m.nik && m.nik.toLowerCase().includes(q)) ||
          (m.phone && m.phone.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 100;
    const paginated = list.slice(offset, offset + limit);

    return { members: paginated, total };
  },

  async getPartyMemberStats(): Promise<{
    totalMembers: number;
    totalMale: number;
    totalFemale: number;
    femalePercentage: number;
    totalOfficials: number;
    totalRegular: number;
    totalVerified: number;
    districts: Record<string, number>;
    subdistricts: Record<string, number>;
    cities: Record<string, number>;
    provinces: Record<string, number>;
    existingTerritories: Array<{
      province?: string | null;
      city?: string | null;
      district?: string | null;
      subdistrict?: string | null;
    }>;
  }> {
    const isPg = await checkPg();
    let allMembers: PartyMember[] = [];

    if (isPg && db) {
      try {
        allMembers = await db.select().from(partyMembers);
      } catch (err) {
        console.warn("Postgres select stats failed, using Supabase/local store:", err);
      }
    }

    if (allMembers.length === 0) {
      const sb = getSupabaseAdmin();
      if (sb) {
        try {
          const { data, error } = await sb.from("party_members").select("*").limit(3000);
          if (!error && data && data.length > 0) {
            allMembers = data.map((m) => ({
              id: m.id,
              sourceId: m.source_id,
              ktaNumber: m.kta_number,
              name: m.name,
              nik: m.nik,
              gender: m.gender,
              birthPlace: m.birth_place,
              birthDate: m.birth_date,
              maritalStatus: m.marital_status,
              nationality: m.nationality,
              job: m.job,
              email: m.email,
              isEmailVerified: m.is_email_verified,
              phone: m.phone,
              province: m.province,
              city: m.city,
              district: m.district,
              subdistrict: m.subdistrict,
              address: m.address,
              postalCode: m.postal_code,
              position: m.position,
              membershipStatus: m.membership_status,
              orgVerificationStatus: m.org_verification_status,
              dppValidationStatus: m.dpp_validation_status,
              dppDecisionDate: m.dpp_decision_date ? new Date(m.dpp_decision_date) : null,
              kpuStatusChangeDate: m.kpu_status_change_date ? new Date(m.kpu_status_change_date) : null,
              createdAt: new Date(m.created_at),
              updatedAt: new Date(m.updated_at),
            }));
          }
        } catch {
          // fallback
        }
      }
    }

    if (allMembers.length === 0) {
      const local = loadLocalStore();
      allMembers = local.partyMembers || [];
    }

    const totalMembers = allMembers.length;
    const totalMale = allMembers.filter((m) => m.gender?.toLowerCase().includes("laki")).length;
    const totalFemale = allMembers.filter((m) => m.gender?.toLowerCase().includes("perempuan")).length;
    const femalePercentage = totalMembers > 0 ? Number(((totalFemale / totalMembers) * 100).toFixed(1)) : 0;

    const totalRegular = allMembers.filter(
      (m) => !m.position || m.position.toLowerCase() === "regular" || m.position.toLowerCase() === "anggota"
    ).length;
    const totalOfficials = totalMembers - totalRegular;

    const totalVerified = allMembers.filter(
      (m) =>
        m.orgVerificationStatus?.toLowerCase().includes("terverifikasi") ||
        m.dppValidationStatus?.toLowerCase().includes("valid")
    ).length;

    const districts: Record<string, number> = {};
    const subdistricts: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const provinces: Record<string, number> = {};

    const existingTerritories: Array<{
      province?: string | null;
      city?: string | null;
      district?: string | null;
      subdistrict?: string | null;
    }> = [];

    for (const m of allMembers) {
      const prov = m.province || "KALIMANTAN BARAT";
      const cit = m.city || "KOTA PONTIANAK";
      const dist = m.district || "Belum Terdata";
      const sub = m.subdistrict || "Belum Terdata";

      provinces[prov] = (provinces[prov] || 0) + 1;
      cities[cit] = (cities[cit] || 0) + 1;
      districts[dist] = (districts[dist] || 0) + 1;
      subdistricts[sub] = (subdistricts[sub] || 0) + 1;

      existingTerritories.push({
        province: m.province,
        city: m.city,
        district: m.district,
        subdistrict: m.subdistrict,
      });
    }

    return {
      totalMembers,
      totalMale,
      totalFemale,
      femalePercentage,
      totalOfficials,
      totalRegular,
      totalVerified,
      districts,
      subdistricts,
      cities,
      provinces,
      existingTerritories,
    };
  },

  async batchUpsertPartyMembers(
    items: NewPartyMember[]
  ): Promise<{ inserted: number; updated: number; total: number }> {
    const isPg = await checkPg();
    let inserted = 0;
    let updated = 0;

    if (isPg && db) {
      try {
        for (const item of items) {
          const existing = await db
            .select()
            .from(partyMembers)
            .where(eq(partyMembers.ktaNumber, item.ktaNumber))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(partyMembers)
              .set({ ...item, updatedAt: new Date() })
              .where(eq(partyMembers.id, existing[0].id));
            updated++;
          } else {
            await db.insert(partyMembers).values(item);
            inserted++;
          }
        }
        return { inserted, updated, total: items.length };
      } catch (err) {
        console.warn("Postgres batchUpsert failed, saving to local store:", err);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const rows = items.map((item) => ({
          kta_number: item.ktaNumber,
          source_id: item.sourceId || null,
          name: item.name,
          nik: item.nik || null,
          gender: item.gender || null,
          birth_place: item.birthPlace || null,
          birth_date: item.birthDate ? String(item.birthDate) : null,
          marital_status: item.maritalStatus || null,
          nationality: item.nationality || "Indonesia",
          job: item.job || null,
          email: item.email || null,
          is_email_verified: item.isEmailVerified ?? false,
          phone: item.phone || null,
          province: item.province || "KALIMANTAN BARAT",
          city: item.city || "KOTA PONTIANAK",
          district: item.district || null,
          subdistrict: item.subdistrict || null,
          address: item.address || null,
          postal_code: item.postalCode || null,
          position: item.position || "regular",
          membership_status: item.membershipStatus || "Aktif",
          org_verification_status: item.orgVerificationStatus || "Belum Terverifikasi",
          dpp_validation_status: item.dppValidationStatus || "Belum Divalidasi DPP",
          dpp_decision_date: item.dppDecisionDate ? new Date(item.dppDecisionDate).toISOString() : null,
          kpu_status_change_date: item.kpuStatusChangeDate ? new Date(item.kpuStatusChangeDate).toISOString() : null,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await sb.from("party_members").upsert(rows, { onConflict: "kta_number" });
        if (!error) {
          return { inserted: items.length, updated: 0, total: items.length };
        }
      } catch (err) {
        console.warn("Supabase batchUpsert failed:", err);
      }
    }

    // Local fallback
    const local = loadLocalStore();
    if (!local.partyMembers) local.partyMembers = [];

    const now = new Date();
    for (const item of items) {
      const idx = local.partyMembers.findIndex(
        (m) => m.ktaNumber.trim() === item.ktaNumber.trim()
      );

      if (idx !== -1) {
        local.partyMembers[idx] = {
          ...local.partyMembers[idx],
          ...item,
          updatedAt: now,
        } as PartyMember;
        updated++;
      } else {
        const newId = local.partyMembers.length
          ? Math.max(...local.partyMembers.map((m) => m.id)) + 1
          : 1;
        const newMember: PartyMember = {
          id: newId,
          sourceId: item.sourceId || null,
          ktaNumber: item.ktaNumber,
          name: item.name,
          nik: item.nik || null,
          gender: item.gender || null,
          birthPlace: item.birthPlace || null,
          birthDate: item.birthDate ? String(item.birthDate) : null,
          maritalStatus: item.maritalStatus || null,
          nationality: item.nationality || "Indonesia",
          job: item.job || null,
          email: item.email || null,
          isEmailVerified: item.isEmailVerified ?? false,
          phone: item.phone || null,
          province: item.province || "KALIMANTAN BARAT",
          city: item.city || "KOTA PONTIANAK",
          district: item.district || null,
          subdistrict: item.subdistrict || null,
          address: item.address || null,
          postalCode: item.postalCode || null,
          position: item.position || "regular",
          membershipStatus: item.membershipStatus || "Aktif",
          orgVerificationStatus: item.orgVerificationStatus || "Belum Terverifikasi",
          dppValidationStatus: item.dppValidationStatus || "Belum Divalidasi DPP",
          dppDecisionDate: item.dppDecisionDate ? new Date(item.dppDecisionDate) : null,
          kpuStatusChangeDate: item.kpuStatusChangeDate ? new Date(item.kpuStatusChangeDate) : null,
          createdAt: now,
          updatedAt: now,
        };
        local.partyMembers.push(newMember);
        inserted++;
      }
    }

    saveLocalStore(local);
    return { inserted, updated, total: items.length };
  },

  async deletePartyMember(id: number): Promise<boolean> {
    const isPg = await checkPg();
    if (isPg && db) {
      try {
        await db.delete(partyMembers).where(eq(partyMembers.id, id));
        return true;
      } catch (err) {
        console.warn("Postgres delete failed, deleting from local store:", err);
      }
    }

    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        const { data: deleted, error } = await sb.from("party_members").delete().eq("id", id).select();
        if (!error && deleted && deleted.length > 0) {
          const local = loadLocalStore();
          if (local.partyMembers) {
            local.partyMembers = local.partyMembers.filter((m) => m.id !== id);
            saveLocalStore(local);
          }
          return true;
        }
      } catch (err) {
        console.warn("Supabase delete party member failed:", err);
      }
    }

    const local = loadLocalStore();
    if (!local.partyMembers) local.partyMembers = [];
    const idx = local.partyMembers.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    local.partyMembers.splice(idx, 1);
    saveLocalStore(local);
    return true;
  },
};


export const dataStore = DataService;


