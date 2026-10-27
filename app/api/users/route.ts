import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { DataService } from "@/lib/services/data-store";
import { hashPassword } from "@/lib/auth/jwt";
import { CreateUserInputSchema } from "@/lib/auth/validation";

/**
 * GET /api/users
 * Mendapatkan daftar seluruh pengguna (Hanya Super Admin)
 */
export async function GET() {
  const session = await getSessionUser();
  if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat melihat daftar pengguna." },
      { status: 403 }
    );
  }

  const userList = await DataService.getUsers();
  return NextResponse.json({
    users: userList,
  });
}

/**
 * POST /api/users
 * Mendaftarkan akun pengguna baru dengan hak akses spesifik
 */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat menambahkan pengguna." },
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
    const msg = parseResult.error.issues[0]?.message || "Data input tidak valid.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parseResult.data;

  // Cek apakah email sudah terdaftar
  const existing = await DataService.getUserByEmail(data.email);
  if (existing) {
    return NextResponse.json({ error: "Email sudah digunakan oleh akun lain." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const newUser = await DataService.createUser({
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
    message: "Pengguna berhasil ditambahkan.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      province: newUser.province,
      city: newUser.city,
      district: newUser.district,
    },
  });
}
