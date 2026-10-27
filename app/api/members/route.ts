import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission, maskNik } from "@/lib/auth/roles";
import type { NewPartyMember } from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    const canViewNik = session ? hasPermission(session.normalizedRole, "members:view_nik") : false;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const province = searchParams.get("province") || undefined;
    const city = searchParams.get("city") || undefined;
    const district = searchParams.get("district") || undefined;
    const subdistrict = searchParams.get("subdistrict") || undefined;
    const position = searchParams.get("position") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const [result, stats] = await Promise.all([
      DataService.getPartyMembers({ search, province, city, district, subdistrict, position, gender, limit, offset }),
      DataService.getPartyMemberStats(),
    ]);

    // Mask NIK if user lacks 'members:view_nik' permission (e.g. viewer role)
    const members = canViewNik
      ? result.members
      : result.members.map((m) => ({
          ...m,
          nik: maskNik(m.nik, false),
        }));

    return NextResponse.json({
      members,
      total: result.total,
      stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch party members";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "members:create")) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak memiliki izin untuk menambah atau mengimpor data anggota." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Batch upsert (from Excel/CSV import)
    if (Array.isArray(body.batch)) {
      const items = body.batch as NewPartyMember[];
      if (items.length === 0) {
        return NextResponse.json({ error: "Daftar anggota import tidak boleh kosong." }, { status: 400 });
      }

      // Validasi item wajib (ktaNumber dan name)
      const validItems = items.filter((item) => item.ktaNumber && item.name);
      if (validItems.length === 0) {
        return NextResponse.json({ error: "Tidak ada baris data yang memiliki No. KTA dan Nama yang valid." }, { status: 400 });
      }

      const summary = await DataService.batchUpsertPartyMembers(validItems);
      return NextResponse.json({
        success: true,
        summary,
        message: `Berhasil memproses ${summary.total} data: ${summary.inserted} kader baru ditambahkan, ${summary.updated} data diperbarui.`,
      });
    }

    // Single member creation
    if (!body.ktaNumber || !body.name) {
      return NextResponse.json({ error: "No. KTA dan Nama Anggota wajib diisi." }, { status: 400 });
    }

    const singleItem: NewPartyMember = {
      ktaNumber: String(body.ktaNumber).trim(),
      name: String(body.name).trim(),
      sourceId: body.sourceId ? String(body.sourceId) : undefined,
      nik: body.nik ? String(body.nik).trim() : undefined,
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

    const summary = await DataService.batchUpsertPartyMembers([singleItem]);
    return NextResponse.json({ success: true, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
