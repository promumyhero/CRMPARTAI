import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { DataService } from "@/lib/services/data-store";
import { hashPassword } from "@/lib/auth/jwt";
import { UpdateUserInputSchema } from "@/lib/auth/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/users/[id]
 * Mengubah role, status, wilayah, atau reset kata sandi pengguna
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getSessionUser();
  if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat mengedit data pengguna." },
      { status: 403 }
    );
  }

  const { id: idStr } = await params;
  const userId = parseInt(idStr, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const parseResult = UpdateUserInputSchema.safeParse(body);
  if (!parseResult.success) {
    const msg = parseResult.error.issues[0]?.message || "Data input tidak valid.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parseResult.data;
  const targetUser = await DataService.getUserById(userId);
  if (!targetUser) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  // Jika mengubah password
  let passwordHash: string | undefined = undefined;
  if (data.password) {
    passwordHash = await hashPassword(data.password);
  }

  // Cegah superadmin mendowngrade diri sendiri jika merupakan satu-satunya superadmin
  if (targetUser.id === session.userId && data.role && data.role !== "superadmin") {
    return NextResponse.json(
      { error: "Anda tidak dapat mengubah peran akun Anda sendiri dari Super Admin." },
      { status: 400 }
    );
  }

  const updated = await DataService.updateUser(userId, {
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
    message: "Data pengguna berhasil diperbarui.",
    user: updated
      ? {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          status: updated.status,
          province: updated.province,
          city: updated.city,
          district: updated.district,
        }
      : null,
  });
}

/**
 * DELETE /api/users/[id]
 * Menghapus akun pengguna dari sistem
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getSessionUser();
  if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat menghapus pengguna." },
      { status: 403 }
    );
  }

  const { id: idStr } = await params;
  const userId = parseInt(idStr, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
  }

  // Cegah menghapus akun sendiri
  if (userId === session.userId) {
    return NextResponse.json(
      { error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk." },
      { status: 400 }
    );
  }

  const success = await DataService.deleteUser(userId);
  if (!success) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan atau gagal dihapus." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Pengguna berhasil dihapus.",
  });
}
