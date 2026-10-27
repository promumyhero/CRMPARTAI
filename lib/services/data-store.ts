import fs from "fs";
import path from "path";
import { db, testDbConnection } from "@/lib/db";
import {
  users,
  activities,
  budgetItems,
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
import bcrypt from "bcryptjs";

// Local storage path for offline / development resilience
const DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DB_FILE = path.join(DATA_DIR, "store.json");

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
  const hashedPassword = bcrypt.hashSync("admin123", 10);

  return {
    users: [
      {
        id: 1,
        name: "Administrator Utama",
        email: "admin@crmforu.com",
        passwordHash: hashedPassword,
        role: "admin",
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

function loadLocalStore(): LocalStoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const initial = getInitialState();
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
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
    if (!parsed.partyMembers) {
      parsed.partyMembers = [];
    }
    return parsed;
  } catch (err) {
    console.error("Error loading local store:", err);
    return getInitialState();
  }
}


function saveLocalStore(state: LocalStoreState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local store:", err);
  }
}

let isPgHealthy: boolean | null = null;

async function checkPg(): Promise<boolean> {
  if (isPgHealthy !== null) return isPgHealthy;
  const res = await testDbConnection();
  isPgHealthy = res.ok;
  return isPgHealthy;
}

// ==========================================
// DATA SERVICE REPOSITORY
// ==========================================

export const DataService = {
  async getDbStatus(): Promise<{ type: "postgres" | "local"; healthy: boolean }> {
    const ok = await checkPg();
    return {
      type: ok ? "postgres" : "local",
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
    const local = loadLocalStore();
    return local.users.find((u) => u.id === id) || null;
  },

  async createUser(data: { name: string; email: string; passwordHash: string; role?: string }): Promise<User> {
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
          })
          .returning();
        return inserted[0];
      } catch (e) {
        console.warn("Falling back to local store for user create", e);
      }
    }
    const local = loadLocalStore();
    const newUser: User = {
      id: local.users.length ? Math.max(...local.users.map((u) => u.id)) + 1 : 1,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || "admin",
      createdAt: new Date(),
    };
    local.users.push(newUser);
    saveLocalStore(local);
    return newUser;
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
        return inserted[0];
      } catch (e) {
        console.warn("Postgres create activity failed", e);
      }
    }
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
    let createdItem: BudgetItem;

    if (isPg) {
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
        createdItem = inserted[0];
      } catch (e) {
        console.warn("Postgres create budget item failed", e);
      }
    }

    const local = loadLocalStore();
    const newId = local.budgetItems.length ? Math.max(...local.budgetItems.map((b) => b.id)) + 1 : 1;
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
    local.budgetItems.push(createdItem);
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
    const local = loadLocalStore();
    const existing = local.budgetItems.find((b) => b.id === id);
    if (!existing) return null;

    const qtyNum = data.qty !== undefined ? parseFloat(String(data.qty)) || 1 : parseFloat(existing.qty);
    const priceNum = data.unitPrice !== undefined ? parseFloat(String(data.unitPrice)) || 0 : parseFloat(existing.unitPrice);
    const estSubtotal = (qtyNum * priceNum).toFixed(2);
    const actSubtotal = data.actualSubtotal !== undefined
      ? (parseFloat(String(data.actualSubtotal)) || 0).toFixed(2)
      : existing.actualSubtotal;

    existing.category = data.category ?? existing.category;
    existing.itemName = data.itemName ?? existing.itemName;
    existing.qty = String(qtyNum);
    existing.unit = data.unit ?? existing.unit;
    existing.unitPrice = String(priceNum);
    existing.estimatedSubtotal = estSubtotal;
    existing.actualSubtotal = actSubtotal;

    saveLocalStore(local);
    await this.syncActivityBudgetTotals(existing.activityId);

    return existing;
  },

  async deleteBudgetItem(id: number): Promise<boolean> {
    const local = loadLocalStore();
    const idx = local.budgetItems.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    const actId = local.budgetItems[idx].activityId;
    local.budgetItems.splice(idx, 1);
    saveLocalStore(local);
    await this.syncActivityBudgetTotals(actId);
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
    const local = loadLocalStore();
    let list = local.autofillDictionary.filter((a) => a.fieldType === fieldType);
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
    const local = loadLocalStore();
    const val = valueText.trim();
    const existing = local.autofillDictionary.find(
      (a) => a.fieldType === fieldType && a.valueText.toLowerCase() === val.toLowerCase()
    );
    if (existing) {
      existing.usageCount += 1;
      existing.lastUsedAt = new Date();
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
        lastUsedAt: new Date(),
      });
    }
    saveLocalStore(local);
  },

  // DOCUMENTS
  async getDocuments(params?: { userId?: number; activityId?: number }): Promise<DocType[]> {
    const local = loadLocalStore();
    let list = local.documents.filter((d) => !d.deletedAt);
    if (params?.activityId) {
      list = list.filter((d) => d.activityId === params.activityId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getDocumentById(id: number): Promise<DocType | null> {
    const local = loadLocalStore();
    return local.documents.find((d) => d.id === id && !d.deletedAt) || null;
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
    const local = loadLocalStore();
    const newId = local.documents.length ? Math.max(...local.documents.map((d) => d.id)) + 1 : 1;
    const now = new Date();
    const newDoc: DocType = {
      id: newId,
      userId: data.userId,
      activityId: data.activityId || null,
      docNumber: data.docNumber,
      docType: data.docType,
      subject: data.subject,
      recipientName: data.recipientName,
      contentPayload: data.contentPayload,
      issuedDate: data.issuedDate || now.toISOString().split("T")[0],
      createdAt: now,
      deletedAt: null,
    };
    local.documents.unshift(newDoc);
    saveLocalStore(local);

    await this.recordAutofillUsage(data.userId, "recipient", data.recipientName);

    return newDoc;
  },

  async deleteDocument(id: number): Promise<boolean> {
    const local = loadLocalStore();
    const doc = local.documents.find((d) => d.id === id);
    if (!doc) return false;
    doc.deletedAt = new Date();
    saveLocalStore(local);
    return true;
  },

  // TEMPLATES
  async getTemplates(): Promise<DocumentTemplate[]> {
    const local = loadLocalStore();
    return local.documentTemplates;
  },

  async getTemplateById(id: number): Promise<DocumentTemplate | null> {
    const local = loadLocalStore();
    return local.documentTemplates.find((t) => t.id === id) || null;
  },

  async saveTemplate(data: Partial<DocumentTemplate> & { name: string; userId: number }): Promise<DocumentTemplate> {
    const local = loadLocalStore();
    const now = new Date();
    if (data.id) {
      const idx = local.documentTemplates.findIndex((t) => t.id === data.id);
      if (idx !== -1) {
        local.documentTemplates[idx] = {
          ...local.documentTemplates[idx],
          ...data,
          updatedAt: now,
        } as DocumentTemplate;
        saveLocalStore(local);
        return local.documentTemplates[idx];
      }
    }
    const newId = local.documentTemplates.length ? Math.max(...local.documentTemplates.map((t) => t.id)) + 1 : 1;
    const newTmpl: DocumentTemplate = {
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
        console.warn("Postgres select stats failed, using local store:", err);
        const local = loadLocalStore();
        allMembers = local.partyMembers || [];
      }
    } else {
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

    const local = loadLocalStore();
    const idx = local.partyMembers.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    local.partyMembers.splice(idx, 1);
    saveLocalStore(local);
    return true;
  },
};


export const dataStore = DataService;


