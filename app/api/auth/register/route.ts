import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { hashPassword } from "@/lib/auth/jwt";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { CreateUserInputSchema } from "@/lib/auth/validation";

/**
 * POST /api/auth/register
 * Endpoint terlindungi: Hanya Administrator dengan izin 'users:manage' yang dapat mendaftarkan akun baru.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
      return NextResponse.json(
        { error: "Akses ditolak. Pendaftaran pengguna hanya dapat dilakukan oleh Administrator (DPD)." },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
    }

    const parseResult = CreateUserInputSchema.safeParse(body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || "Data pendaftaran tidak valid.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const data = parseResult.data;

    // Hanya superadmin yang dapat menetapkan role superadmin
    if (data.role === "superadmin" && session.normalizedRole !== "superadmin") {
      return NextResponse.json(
        { error: "Hanya Super Admin yang dapat membuat akun tingkat Super Admin." },
        { status: 403 }
      );
    }

    const existing = await DataService.getUserByEmail(data.email);
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar pada sistem." }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await DataService.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone || undefined,
      status: data.status,
      province: data.province || undefined,
      city: data.city || undefined,
      district: data.district || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: unknown) {
    console.error("Register exception:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mendaftarkan pengguna." },
      { status: 500 }
    );
  }
}
