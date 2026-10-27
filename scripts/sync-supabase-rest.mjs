import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envLocalPath = path.join(process.cwd(), ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.substring("NEXT_PUBLIC_SUPABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
    }
    if (trimmed.startsWith("SUPABASE_SECRET_KEY=")) {
      supabaseSecretKey = trimmed.substring("SUPABASE_SECRET_KEY=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
}

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SECRET_KEY belum ada di .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false }
});

const dataFile = path.join(process.cwd(), ".data", "store.json");
if (!fs.existsSync(dataFile)) {
  console.error("❌ File .data/store.json tidak ditemukan.");
  process.exit(1);
}

const localData = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

async function syncAll() {
  console.log("🚀 Memulai sinkronisasi via Supabase Admin REST Client...");

  // 1. Users
  if (localData.users?.length) {
    console.log(`Mengunggah ${localData.users.length} users (RBAC)...`);
    const usersPayload = localData.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password_hash: u.passwordHash,
      role: u.role || "operator",
      phone: u.phone || null,
      status: u.status || "active",
      province: u.province || "KALIMANTAN BARAT",
      city: u.city || null,
      district: u.district || null,
      created_at: new Date(u.createdAt).toISOString()
    }));
    const { error } = await supabase.from("users").upsert(usersPayload, { onConflict: "email" });
    if (error) {
      console.error("❌ Gagal mengunggah users:", error.message);
      return;
    }
    console.log("✅ Users berhasil diunggah!");
  }

  // 2. Activities
  if (localData.activities?.length) {
    console.log(`Mengunggah ${localData.activities.length} activities...`);
    const payload = localData.activities.map((a) => ({
      id: a.id,
      user_id: a.userId,
      title: a.title,
      category: a.category || "Umum",
      location: a.location || null,
      pic_name: a.picName || null,
      status: a.status ?? 1,
      start_date: new Date(a.startDate).toISOString(),
      end_date: a.endDate ? new Date(a.endDate).toISOString() : null,
      checklist: a.checklist || [],
      total_estimated_budget: a.totalEstimatedBudget || "0.00",
      total_actual_budget: a.totalActualBudget || "0.00",
      created_at: new Date(a.createdAt).toISOString(),
      updated_at: new Date(a.updatedAt).toISOString(),
      deleted_at: a.deletedAt ? new Date(a.deletedAt).toISOString() : null
    }));
    const { error } = await supabase.from("activities").upsert(payload, { onConflict: "id" });
    if (error) console.error("❌ Gagal mengunggah activities:", error.message);
    else console.log("✅ Activities berhasil diunggah!");
  }

  // 3. Budget Items
  if (localData.budgetItems?.length) {
    console.log(`Mengunggah ${localData.budgetItems.length} budget items...`);
    const payload = localData.budgetItems.map((b) => ({
      id: b.id,
      activity_id: b.activityId,
      category: b.category,
      item_name: b.itemName,
      qty: b.qty,
      unit: b.unit,
      unit_price: b.unitPrice,
      estimated_subtotal: b.estimatedSubtotal,
      actual_subtotal: b.actualSubtotal || "0.00",
      created_at: new Date(b.createdAt).toISOString()
    }));
    const { error } = await supabase.from("budget_items").upsert(payload, { onConflict: "id" });
    if (error) console.error("❌ Gagal mengunggah budget_items:", error.message);
    else console.log("✅ Budget items berhasil diunggah!");
  }

  // 4. Document Templates
  if (localData.documentTemplates?.length) {
    console.log(`Mengunggah ${localData.documentTemplates.length} document templates...`);
    const payload = localData.documentTemplates.map((t) => ({
      id: t.id,
      user_id: t.userId,
      name: t.name,
      doc_type: t.docType || 1,
      show_kop: t.showKop ?? true,
      header_org_name: t.headerOrgName || null,
      header_org_sub: t.headerOrgSub || null,
      header_org_address: t.headerOrgAddress || null,
      header_contact: t.headerContact || null,
      paper_size: t.paperSize || "A4",
      default_opening: t.defaultOpening || null,
      default_closing: t.defaultClosing || null,
      signer_title: t.signerTitle || null,
      signer_name: t.signerName || null,
      signer_nip: t.signerNip || null,
      created_at: new Date(t.createdAt).toISOString(),
      updated_at: new Date(t.updatedAt).toISOString()
    }));
    const { error } = await supabase.from("document_templates").upsert(payload, { onConflict: "id" });
    if (error) console.error("❌ Gagal mengunggah document_templates:", error.message);
    else console.log("✅ Document templates berhasil diunggah!");
  }

  // 5. Documents
  if (localData.documents?.length) {
    console.log(`Mengunggah ${localData.documents.length} documents...`);
    const payload = localData.documents.map((d) => ({
      id: d.id,
      activity_id: d.activityId || null,
      user_id: d.userId,
      doc_number: d.docNumber,
      doc_type: d.docType,
      subject: d.subject,
      recipient_name: d.recipientName,
      content_payload: d.contentPayload,
      issued_date: d.issuedDate,
      created_at: new Date(d.createdAt).toISOString(),
      deleted_at: d.deletedAt ? new Date(d.deletedAt).toISOString() : null
    }));
    const { error } = await supabase.from("documents").upsert(payload, { onConflict: "id" });
    if (error) console.error("❌ Gagal mengunggah documents:", error.message);
    else console.log("✅ Documents berhasil diunggah!");
  }

  // 6. Autofill Dictionary
  if (localData.autofillDictionary?.length) {
    console.log(`Mengunggah ${localData.autofillDictionary.length} autofill entries...`);
    const payload = localData.autofillDictionary.map((af) => ({
      id: af.id,
      user_id: af.userId,
      field_type: af.fieldType,
      value_text: af.valueText,
      metadata: af.metadata || {},
      usage_count: af.usageCount || 1,
      last_used_at: new Date(af.lastUsedAt).toISOString()
    }));
    const { error } = await supabase.from("autofill_dictionary").upsert(payload, { onConflict: "id" });
    if (error) console.error("❌ Gagal mengunggah autofill_dictionary:", error.message);
    else console.log("✅ Autofill dictionary berhasil diunggah!");
  }

  // 7. Party Members (Batch of 100)
  if (localData.partyMembers?.length) {
    console.log(`Mengunggah ${localData.partyMembers.length} kader dan anggota partai...`);
    const chunkSize = 100;
    for (let i = 0; i < localData.partyMembers.length; i += chunkSize) {
      const chunk = localData.partyMembers.slice(i, i + chunkSize);
      const payload = chunk.map((m) => ({
        source_id: m.sourceId || null,
        kta_number: m.ktaNumber,
        name: m.name,
        nik: m.nik || null,
        gender: m.gender || null,
        birth_place: m.birthPlace || null,
        birth_date: m.birthDate || null,
        marital_status: m.maritalStatus || null,
        nationality: m.nationality || "Indonesia",
        job: m.job || null,
        email: m.email || null,
        is_email_verified: m.isEmailVerified ?? false,
        phone: m.phone || null,
        province: m.province || "KALIMANTAN BARAT",
        city: m.city || "KOTA PONTIANAK",
        district: m.district || null,
        subdistrict: m.subdistrict || null,
        address: m.address || null,
        postal_code: m.postalCode || null,
        position: m.position || "regular",
        membership_status: m.membershipStatus || "Aktif",
        org_verification_status: m.orgVerificationStatus || "Belum Terverifikasi",
        dpp_validation_status: m.dppValidationStatus || "Belum Divalidasi DPP",
        created_at: new Date(m.createdAt).toISOString(),
        updated_at: new Date(m.updatedAt).toISOString()
      }));

      const { error } = await supabase.from("party_members").upsert(payload, { onConflict: "kta_number" });
      if (error) {
        console.error(`\n❌ Gagal pada batch ${i}:`, error.message);
      } else {
        process.stdout.write(`\rProgress anggota: ${Math.min(i + chunkSize, localData.partyMembers.length)} / ${localData.partyMembers.length}`);
      }
    }
    console.log("\n✅ Seluruh data kader dan anggota partai berhasil diunggah!");
  }

  console.log("🎉 Sinkronisasi seluruh data ke Supabase selesai 100%!");
}

syncAll();
