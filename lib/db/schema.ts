import {
  pgTable,
  bigint,
  varchar,
  smallint,
  timestamp,
  numeric,
  jsonb,
  date,
  integer,
  boolean,
  text,
  unique,
  index,
} from "drizzle-orm/pg-core";

// 1. Users Table (Multi-User authentication & team access)
export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // 'admin' | 'member'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. Activities Table
export const activities = pgTable(
  "activities",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull().default("Umum"),
    location: varchar("location", { length: 255 }),
    picName: varchar("pic_name", { length: 150 }),
    status: smallint("status").notNull().default(1), // 1: Draft, 2: Scheduled, 3: Ongoing, 4: Completed, 5: Cancelled
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    checklist: jsonb("checklist").$type<Array<{ id: string; text: string; done: boolean }>>().default([]),
    totalEstimatedBudget: numeric("total_estimated_budget", { precision: 15, scale: 2 }).notNull().default("0"),
    totalActualBudget: numeric("total_actual_budget", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_activities_user_start_id").on(table.userId, table.startDate, table.id),
  ]
);

// 3. Budget Items Table
export const budgetItems = pgTable(
  "budget_items",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    activityId: bigint("activity_id", { mode: "number" })
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(), // Konsumsi, Transportasi, Perlengkapan, dll
    itemName: varchar("item_name", { length: 255 }).notNull(),
    qty: numeric("qty", { precision: 10, scale: 2 }).notNull().default("1"),
    unit: varchar("unit", { length: 50 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
    estimatedSubtotal: numeric("estimated_subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    actualSubtotal: numeric("actual_subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_budget_items_activity").on(table.activityId),
  ]
);

// 4. Documents Table
export const documents = pgTable(
  "documents",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    activityId: bigint("activity_id", { mode: "number" }).references(() => activities.id, { onDelete: "set null" }),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    docNumber: varchar("doc_number", { length: 100 }).notNull(),
    docType: smallint("doc_type").notNull(), // 1: Undangan, 2: Permohonan Dana, 3: Surat Tugas, 4: Pemberitahuan, 5: Kustom
    subject: varchar("subject", { length: 255 }).notNull(),
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    contentPayload: jsonb("content_payload").$type<{
      opening?: string;
      bodyText?: string;
      closing?: string;
      eventDate?: string;
      eventTime?: string;
      eventLocation?: string;
      includeBudgetSummary?: boolean;
      includeBudgetTable?: boolean;
      signerTitle?: string;
      signerName?: string;
      signerNip?: string;
      customVariables?: Record<string, string>;
      templateId?: number;
      paperSize?: "A4" | "F4";
    }>().notNull(),
    issuedDate: date("issued_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_documents_user_id").on(table.userId),
    index("idx_documents_activity_id").on(table.activityId),
  ]
);

// 5. Autofill Dictionary Table
export const autofillDictionary = pgTable(
  "autofill_dictionary",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    fieldType: varchar("field_type", { length: 50 }).notNull(), // 'location' | 'budget_item' | 'recipient' | 'unit' | 'category'
    valueText: varchar("value_text", { length: 255 }).notNull(),
    metadata: jsonb("metadata").$type<{
      lastUnit?: string;
      lastPrice?: number;
      category?: string;
      address?: string;
    }>(),
    usageCount: integer("usage_count").notNull().default(1),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_autofill_user_field_value").on(table.userId, table.fieldType, table.valueText),
    index("idx_autofill_lookup").on(table.userId, table.fieldType),
  ]
);

// 6. Document Templates Table (Flexible Template Customizer)
export const documentTemplates = pgTable("document_templates", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  docType: smallint("doc_type").notNull().default(1), // 1: Undangan, 2: Permohonan Dana, 3: Surat Tugas, 4: Pemberitahuan, 5: Kustom
  showKop: boolean("show_kop").notNull().default(true),
  headerOrgName: varchar("header_org_name", { length: 255 }),
  headerOrgSub: varchar("header_org_sub", { length: 255 }),
  headerOrgAddress: text("header_org_address"),
  headerContact: varchar("header_contact", { length: 255 }),
  paperSize: varchar("paper_size", { length: 10 }).notNull().default("A4"), // 'A4' | 'F4'
  defaultOpening: text("default_opening"),
  defaultClosing: text("default_closing"),
  signerTitle: varchar("signer_title", { length: 150 }),
  signerName: varchar("signer_name", { length: 150 }),
  signerNip: varchar("signer_nip", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 7. Party Members & Cadres Table (Direktori Anggota & Pengurus Partai)
export const partyMembers = pgTable(
  "party_members",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sourceId: varchar("source_id", { length: 100 }), // UUID asli sumber jika ada
    ktaNumber: varchar("kta_number", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    nik: varchar("nik", { length: 25 }),
    gender: varchar("gender", { length: 20 }), // 'Laki-laki' | 'Perempuan'
    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date"),
    maritalStatus: varchar("marital_status", { length: 50 }),
    nationality: varchar("nationality", { length: 50 }).default("Indonesia"),
    job: varchar("job", { length: 100 }),
    email: varchar("email", { length: 255 }),
    isEmailVerified: boolean("is_email_verified").default(false),
    phone: varchar("phone", { length: 50 }),
    province: varchar("province", { length: 100 }).default("KALIMANTAN BARAT"),
    city: varchar("city", { length: 100 }).default("KOTA PONTIANAK"),
    district: varchar("district", { length: 100 }), // Kecamatan
    subdistrict: varchar("subdistrict", { length: 100 }), // Kelurahan
    address: text("address"),
    postalCode: varchar("postal_code", { length: 20 }),
    position: varchar("position", { length: 100 }).notNull().default("regular"), // Ketua, Sekretaris, Bendahara, dll.
    membershipStatus: varchar("membership_status", { length: 50 }).default("Aktif"),
    orgVerificationStatus: varchar("org_verification_status", { length: 100 }).default("Belum Terverifikasi"),
    dppValidationStatus: varchar("dpp_validation_status", { length: 100 }).default("Belum Divalidasi DPP"),
    dppDecisionDate: timestamp("dpp_decision_date", { withTimezone: true }),
    kpuStatusChangeDate: timestamp("kpu_status_change_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_party_members_kta").on(table.ktaNumber),
    index("idx_party_members_district_subdistrict").on(table.district, table.subdistrict),
    index("idx_party_members_position").on(table.position),
    index("idx_party_members_nik").on(table.nik),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type NewBudgetItem = typeof budgetItems.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type AutofillEntry = typeof autofillDictionary.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;

export type PartyMember = typeof partyMembers.$inferSelect;
export type NewPartyMember = typeof partyMembers.$inferInsert;

