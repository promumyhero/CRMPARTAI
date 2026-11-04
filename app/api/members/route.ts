import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission, maskNik } from "@/lib/auth/roles";
import type { NewPartyMember } from "@/lib/db/schema";
import { getOrCreateRequestId, logger, recordRouteMetric } from "@/lib/observability/logger";

export async function GET(req: Request) {
  const startMs = performance.now();
  const requestId = getOrCreateRequestId(req);

  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "members:view")) {
      recordRouteMetric("/api/members", 401, performance.now() - startMs);
      return NextResponse.json(
        { error: "Akses ditolak. Silakan masuk terlebih dahulu." },
        { status: 401, headers: { "X-Request-Id": requestId } }
      );
    }
    const canViewNik = hasPermission(session.normalizedRole, "members:view_nik");

    const { searchParams } = new URL(req.url);

    // Fast real-time duplicate check endpoint for manual input form
    if (searchParams.get("checkDuplicate") === "1") {
      const ktaNumber = searchParams.get("ktaNumber")?.trim() || undefined;
      const nik = searchParams.get("nik")?.trim() || undefined;
      const dupResult = await DataService.checkDuplicatePartyMembers([{ ktaNumber, nik }]);
      const safeDuplicates = dupResult.duplicates.map((d) => ({
        ...d,
        nik: canViewNik ? d.nik : maskNik(d.nik, false),
      }));

      recordRouteMetric("/api/members", 200, performance.now() - startMs);
      return NextResponse.json(
        {
          isDuplicate: safeDuplicates.length > 0,
          duplicates: safeDuplicates,
        },
        { headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } }
      );
    }

    const search = searchParams.get("search") || undefined;
    const province = searchParams.get("province") || undefined;
    const city = searchParams.get("city") || undefined;
    const district = searchParams.get("district") || undefined;
    const subdistrict = searchParams.get("subdistrict") || undefined;
    const position = searchParams.get("position") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const forceStats = searchParams.get("refreshStats") === "1";

    const limit = Math.min(1000, Math.max(1, limitParam ? parseInt(limitParam, 10) : 100));
    const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

    const [result, stats] = await Promise.all([
      DataService.getPartyMembers({ search, province, city, district, subdistrict, position, gender, limit, offset }),
      DataService.getPartyMemberStats(forceStats),
    ]);

    // Mask NIK if user lacks 'members:view_nik' permission (e.g. viewer role)
    const members = canViewNik
      ? result.members
      : result.members.map((m) => ({
          ...m,
          nik: maskNik(m.nik, false),
        }));

    recordRouteMetric("/api/members", 200, performance.now() - startMs);
    return NextResponse.json(
      {
        members,
        total: result.total,
        stats,
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (err: unknown) {
    const durationMs = performance.now() - startMs;
    recordRouteMetric("/api/members", 500, durationMs);
    logger.error(
      {
        event: "members_fetch_failed",
        entryPoint: "api_members",
        requestId,
        durationMs: Math.round(durationMs),
        error: err instanceof Error ? err.message : "unknown_error",
      },
      "Failed to fetch party members"
    );
    return NextResponse.json(
      { error: "Gagal mengambil data anggota." },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}

export async function POST(req: Request) {
  const startMs = performance.now();
  const requestId = getOrCreateRequestId(req);

  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "members:create")) {
      recordRouteMetric("/api/members", 403, performance.now() - startMs);
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk menambah atau mengimpor data anggota." },
        { status: 403, headers: { "X-Request-Id": requestId } }
      );
    }

    const body = await req.json();

    // 1. Pre-flight batch duplicate check (used by Excel/CSV import modal before committing)
    if (body.action === "check_duplicates" && Array.isArray(body.candidates)) {
      const candidates = (body.candidates as Array<{ ktaNumber?: string; nik?: string }>).slice(0, 1000);
      const dupResult = await DataService.checkDuplicatePartyMembers(candidates);
      recordRouteMetric("/api/members", 200, performance.now() - startMs);
      return NextResponse.json(
        {
          duplicatesCount: dupResult.duplicates.length,
          duplicates: dupResult.duplicates,
          byKta: dupResult.byKta,
          byNik: dupResult.byNik,
        },
        { headers: { "X-Request-Id": requestId } }
      );
    }

    // 2. Batch upsert (from Excel/CSV import)
    if (Array.isArray(body.batch)) {
      const items = body.batch as NewPartyMember[];
      const duplicateStrategy: "update" | "skip" =
        body.duplicateStrategy === "skip" ? "skip" : "update";

      if (items.length === 0) {
        return NextResponse.json(
          { error: "Daftar anggota import tidak boleh kosong." },
          { status: 400, headers: { "X-Request-Id": requestId } }
        );
      }

      // Validasi item wajib (ktaNumber dan name)
      const validItems = items.filter(
        (item) => item.ktaNumber && String(item.ktaNumber).trim() && item.name && String(item.name).trim()
      );
      if (validItems.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada baris data yang memiliki No. KTA dan Nama yang valid." },
          { status: 400, headers: { "X-Request-Id": requestId } }
        );
      }

      const summary = await DataService.batchUpsertPartyMembers(validItems, {
        duplicateStrategy,
      });

      const durationMs = performance.now() - startMs;
      recordRouteMetric("/api/members", 200, durationMs);
      logger.info(
        {
          event: "members_batch_imported",
          entryPoint: "api_members",
          requestId,
          actorUserId: session.userId,
          actorRole: session.normalizedRole,
          duplicateStrategy,
          inserted: summary.inserted,
          updated: summary.updated,
          skipped: summary.skipped,
          duplicatesFound: summary.duplicatesFound,
          durationMs: Math.round(durationMs),
        },
        "Party members batch import completed"
      );

      return NextResponse.json(
        {
          success: true,
          summary,
          message:
            summary.skipped > 0
              ? `Berhasil: ${summary.inserted} kader baru ditambahkan, ${summary.skipped} data duplikat dilewati.`
              : `Berhasil: ${summary.inserted} kader baru ditambahkan, ${summary.updated} data diperbarui.`,
        },
        { headers: { "X-Request-Id": requestId } }
      );
    }

    // 3. Single member creation (with strict duplicate warning unless allowOverwrite === true)
    const ktaNumber = body.ktaNumber ? String(body.ktaNumber).trim() : "";
    const name = body.name ? String(body.name).trim() : "";
    const nik = body.nik ? String(body.nik).trim() : undefined;
    const allowOverwrite = Boolean(body.allowOverwrite);

    if (!ktaNumber || !name) {
      return NextResponse.json(
        { error: "No. KTA dan Nama Lengkap Anggota wajib diisi." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    if (nik && (!/^\d{16}$/.test(nik))) {
      return NextResponse.json(
        { error: "Format NIK harus terdiri dari tepat 16 digit angka." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const dupCheck = await DataService.checkDuplicatePartyMembers([{ ktaNumber, nik }]);
    if (dupCheck.duplicates.length > 0 && !allowOverwrite) {
      const existing = dupCheck.duplicates[0];
      const matchReason =
        existing.matchedBy === "both"
          ? `No. KTA (${existing.ktaNumber}) dan NIK`
          : existing.matchedBy === "ktaNumber"
            ? `No. KTA (${existing.ktaNumber})`
            : `NIK (${existing.nik})`;

      logger.warn(
        {
          event: "member_duplicate_prevented",
          entryPoint: "api_members",
          requestId,
          actorUserId: session.userId,
          matchedBy: existing.matchedBy,
          existingMemberId: existing.id,
        },
        "Duplicate party member creation blocked with warning"
      );

      recordRouteMetric("/api/members", 409, performance.now() - startMs);
      return NextResponse.json(
        {
          error: `Peringatan Duplikat Data: ${matchReason} sudah terdaftar di database atas nama "${existing.name}" (${existing.district || existing.city || "Kalimantan Barat"}).`,
          code: "DUPLICATE_MEMBER",
          duplicates: dupCheck.duplicates,
        },
        { status: 409, headers: { "X-Request-Id": requestId } }
      );
    }

    const singleItem: NewPartyMember = {
      ktaNumber,
      name,
      sourceId: body.sourceId ? String(body.sourceId) : undefined,
      nik,
      gender: body.gender || undefined,
      birthPlace: body.birthPlace || undefined,
      birthDate: body.birthDate || undefined,
      maritalStatus: body.maritalStatus || undefined,
      nationality: body.nationality || "Indonesia",
      job: body.job || undefined,
      email: body.email || undefined,
      isEmailVerified: Boolean(body.isEmailVerified),
      phone: body.phone ? String(body.phone).trim() : undefined,
      province: body.province || "KALIMANTAN BARAT",
      city: body.city || "KOTA PONTIANAK",
      district: body.district || undefined,
      subdistrict: body.subdistrict || undefined,
      address: body.address || undefined,
      postalCode: body.postalCode || undefined,
      position: body.position || "regular",
      membershipStatus: body.membershipStatus || "Aktif",
      orgVerificationStatus: body.orgVerificationStatus || "Belum Terverifikasi",
      dppValidationStatus: body.dppValidationStatus || "Belum Divalidasi DPP",
      dppDecisionDate: body.dppDecisionDate ? new Date(body.dppDecisionDate) : undefined,
      kpuStatusChangeDate: body.kpuStatusChangeDate ? new Date(body.kpuStatusChangeDate) : undefined,
    };

    const summary = await DataService.batchUpsertPartyMembers([singleItem], {
      duplicateStrategy: "update",
    });

    const durationMs = performance.now() - startMs;
    recordRouteMetric("/api/members", 200, durationMs);
    logger.info(
      {
        event: allowOverwrite ? "member_duplicate_overwritten" : "member_created",
        entryPoint: "api_members",
        requestId,
        actorUserId: session.userId,
        ktaNumber,
        durationMs: Math.round(durationMs),
      },
      "Single party member saved"
    );

    return NextResponse.json(
      {
        success: true,
        summary,
        message:
          summary.updated > 0
            ? `Data anggota "${name}" berhasil diperbarui.`
            : `Anggota baru "${name}" berhasil ditambahkan ke database.`,
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (err: unknown) {
    const durationMs = performance.now() - startMs;
    recordRouteMetric("/api/members", 500, durationMs);
    logger.error(
      {
        event: "member_save_failed",
        entryPoint: "api_members",
        requestId,
        durationMs: Math.round(durationMs),
        error: err instanceof Error ? err.message : "unknown_error",
      },
      "Failed to save party member"
    );
    return NextResponse.json(
      { error: "Gagal menyimpan data anggota ke server." },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
