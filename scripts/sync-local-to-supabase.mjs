import fs from "fs";
import path from "path";
import postgres from "postgres";

const envLocalPath = path.join(process.cwd(), ".env.local");
let dbUrl = process.env.DATABASE_URL;

if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      dbUrl = trimmed.substring("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
    }
  }
}

if (!dbUrl || dbUrl.includes("localhost:5432")) {
  console.log("⚠️ DATABASE_URL belum diarahkan ke Supabase.");
  console.log("Silakan masukkan Supabase Database Connection URI di .env.local terlebih dahulu.");
  console.log("Format: postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres");
  process.exit(1);
}

const dataFile = path.join(process.cwd(), ".data", "store.json");
if (!fs.existsSync(dataFile)) {
  console.log("❌ File .data/store.json tidak ditemukan.");
  process.exit(1);
}

const localData = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
const sql = postgres(dbUrl, { max: 1 });

async function sync() {
  console.log("🚀 Memulai sinkronisasi data dari .data/store.json ke Supabase...");

  try {
    // 1. Users (Multi-User & RBAC)
    if (localData.users?.length) {
      console.log(`Mengunggah ${localData.users.length} users...`);
      for (const u of localData.users) {
        await sql`
          INSERT INTO users (id, name, email, password_hash, role, phone, status, province, city, district, created_at)
          VALUES (
            ${u.id}, ${u.name}, ${u.email}, ${u.passwordHash}, ${u.role || 'operator'},
            ${u.phone || null}, ${u.status || 'active'}, ${u.province || 'KALIMANTAN BARAT'},
            ${u.city || null}, ${u.district || null}, ${new Date(u.createdAt)}
          )
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            status = EXCLUDED.status,
            province = EXCLUDED.province,
            city = EXCLUDED.city,
            district = EXCLUDED.district;
        `;
      }
    }

    // 2. Activities
    if (localData.activities?.length) {
      console.log(`Mengunggah ${localData.activities.length} activities...`);
      for (const a of localData.activities) {
        await sql`
          INSERT INTO activities (id, user_id, title, category, location, pic_name, status, start_date, end_date, checklist, total_estimated_budget, total_actual_budget, created_at, updated_at, deleted_at)
          VALUES (${a.id}, ${a.userId}, ${a.title}, ${a.category || 'Umum'}, ${a.location || null}, ${a.picName || null}, ${a.status ?? 1}, ${new Date(a.startDate)}, ${a.endDate ? new Date(a.endDate) : null}, ${JSON.stringify(a.checklist || [])}, ${a.totalEstimatedBudget || '0.00'}, ${a.totalActualBudget || '0.00'}, ${new Date(a.createdAt)}, ${new Date(a.updatedAt)}, ${a.deletedAt ? new Date(a.deletedAt) : null})
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at;
        `;
      }
    }

    // 3. Budget Items
    if (localData.budgetItems?.length) {
      console.log(`Mengunggah ${localData.budgetItems.length} budget items...`);
      for (const b of localData.budgetItems) {
        await sql`
          INSERT INTO budget_items (id, activity_id, category, item_name, qty, unit, unit_price, estimated_subtotal, actual_subtotal, created_at)
          VALUES (${b.id}, ${b.activityId}, ${b.category}, ${b.itemName}, ${b.qty}, ${b.unit}, ${b.unitPrice}, ${b.estimatedSubtotal}, ${b.actualSubtotal || '0.00'}, ${new Date(b.createdAt)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 4. Document Templates
    if (localData.documentTemplates?.length) {
      console.log(`Mengunggah ${localData.documentTemplates.length} document templates...`);
      for (const t of localData.documentTemplates) {
        await sql`
          INSERT INTO document_templates (id, user_id, name, doc_type, show_kop, header_org_name, header_org_sub, header_org_address, header_contact, paper_size, default_opening, default_closing, signer_title, signer_name, signer_nip, created_at, updated_at)
          VALUES (${t.id}, ${t.userId}, ${t.name}, ${t.docType || 1}, ${t.showKop ?? true}, ${t.headerOrgName || null}, ${t.headerOrgSub || null}, ${t.headerOrgAddress || null}, ${t.headerContact || null}, ${t.paperSize || 'A4'}, ${t.defaultOpening || null}, ${t.defaultClosing || null}, ${t.signerTitle || null}, ${t.signerName || null}, ${t.signerNip || null}, ${new Date(t.createdAt)}, ${new Date(t.updatedAt)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 5. Documents
    if (localData.documents?.length) {
      console.log(`Mengunggah ${localData.documents.length} documents...`);
      for (const d of localData.documents) {
        await sql`
          INSERT INTO documents (id, activity_id, user_id, doc_number, doc_type, subject, recipient_name, content_payload, issued_date, created_at, deleted_at)
          VALUES (${d.id}, ${d.activityId || null}, ${d.userId}, ${d.docNumber}, ${d.docType}, ${d.subject}, ${d.recipientName}, ${JSON.stringify(d.contentPayload)}, ${d.issuedDate}, ${new Date(d.createdAt)}, ${d.deletedAt ? new Date(d.deletedAt) : null})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 6. Autofill Dictionary
    if (localData.autofillDictionary?.length) {
      console.log(`Mengunggah ${localData.autofillDictionary.length} autofill entries...`);
      for (const af of localData.autofillDictionary) {
        await sql`
          INSERT INTO autofill_dictionary (id, user_id, field_type, value_text, metadata, usage_count, last_used_at)
          VALUES (${af.id}, ${af.userId}, ${af.fieldType}, ${af.valueText}, ${JSON.stringify(af.metadata || {})}, ${af.usageCount || 1}, ${new Date(af.lastUsedAt)})
          ON CONFLICT (user_id, field_type, value_text) DO UPDATE SET usage_count = EXCLUDED.usage_count, last_used_at = EXCLUDED.last_used_at;
        `;
      }
    }

    // 7. Party Members (Batch insert in chunks of 100)
    if (localData.partyMembers?.length) {
      console.log(`Mengunggah ${localData.partyMembers.length} anggota/kader partai...`);
      const chunkSize = 100;
      for (let i = 0; i < localData.partyMembers.length; i += chunkSize) {
        const chunk = localData.partyMembers.slice(i, i + chunkSize);
        for (const m of chunk) {
          await sql`
            INSERT INTO party_members (
              source_id, kta_number, name, nik, gender, birth_place, birth_date,
              marital_status, nationality, job, email, is_email_verified, phone,
              province, city, district, subdistrict, address, postal_code,
              position, membership_status, org_verification_status, dpp_validation_status,
              created_at, updated_at
            ) VALUES (
              ${m.sourceId || null}, ${m.ktaNumber}, ${m.name}, ${m.nik || null}, ${m.gender || null}, ${m.birthPlace || null}, ${m.birthDate || null},
              ${m.maritalStatus || null}, ${m.nationality || 'Indonesia'}, ${m.job || null}, ${m.email || null}, ${m.isEmailVerified ?? false}, ${m.phone || null},
              ${m.province || 'KALIMANTAN BARAT'}, ${m.city || 'KOTA PONTIANAK'}, ${m.district || null}, ${m.subdistrict || null}, ${m.address || null}, ${m.postalCode || null},
              ${m.position || 'regular'}, ${m.membershipStatus || 'Aktif'}, ${m.orgVerificationStatus || 'Belum Terverifikasi'}, ${m.dppValidationStatus || 'Belum Divalidasi DPP'},
              ${new Date(m.createdAt)}, ${new Date(m.updatedAt)}
            ) ON CONFLICT (kta_number) DO NOTHING;
          `;
        }
        process.stdout.write(`\rProgress anggota: ${Math.min(i + chunkSize, localData.partyMembers.length)} / ${localData.partyMembers.length}`);
      }
      console.log("\n✅ Anggota partai selesai diunggah!");
    }

    // Reset sequence generators
    try {
      await sql`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));`;
      await sql`SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 1));`;
      await sql`SELECT setval('budget_items_id_seq', COALESCE((SELECT MAX(id) FROM budget_items), 1));`;
      await sql`SELECT setval('document_templates_id_seq', COALESCE((SELECT MAX(id) FROM document_templates), 1));`;
      await sql`SELECT setval('party_members_id_seq', COALESCE((SELECT MAX(id) FROM party_members), 1));`;
    } catch {
      // Sequence name might differ if created without identity
    }

    console.log("🎉 Sinkronisasi seluruh tabel dan data ke Supabase berhasil!");
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat sinkronisasi:", err);
  } finally {
    await sql.end();
  }
}

sync();
