import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { DataService } from "@/lib/services/data-store";
import { hashPassword } from "@/lib/auth/jwt";
import { CreateUserInputSchema } from "@/lib/auth/validation";
import {
  logger,
  getOrCreateRequestId,
  recordRouteMetric,
} from "@/lib/observability/logger";

/**
 * GET /api/users
 * Mendapatkan daftar seluruh pengguna (Hanya Super Admin)
 */
export async function GET(req: Request) {
  const startTime = Date.now();
  const requestId = getOrCreateRequestId(req);

  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
      recordRouteMetric("GET /api/users", 403, Date.now() - startTime);
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat melihat daftar pengguna." },
        { status: 403, headers: { "X-Request-Id": requestId } }
      );
    }

    const userList = await DataService.getUsers();
    recordRouteMetric("GET /api/users", 200, Date.now() - startTime);
    return NextResponse.json(
      { users: userList },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (err: unknown) {
    logger.error(
      {
        event: "users_list_error",
        entryPoint: "api_users",
        requestId,
        error: err instanceof Error ? err.message : String(err),
      },
      "Failed to fetch users list"
    );
    recordRouteMetric("GET /api/users", 500, Date.now() - startTime);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengguna." },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}

/**
 * POST /api/users
 * Mendaftarkan akun pengguna baru dengan hak akses spesifik
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = getOrCreateRequestId(req);

  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "users:manage")) {
      recordRouteMetric("POST /api/users", 403, Date.now() - startTime);
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Super Admin (DPD) yang dapat menambahkan pengguna." },
        { status: 403, headers: { "X-Request-Id": requestId } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      recordRouteMetric("POST /api/users", 400, Date.now() - startTime);
      return NextResponse.json(
        { error: "Payload JSON tidak valid." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const parseResult = CreateUserInputSchema.safeParse(body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || "Data input tidak valid.";
      recordRouteMetric("POST /api/users", 400, Date.now() - startTime);
      return NextResponse.json(
        { error: msg },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const data = parseResult.data;

    // Cek apakah email sudah terdaftar
    const existing = await DataService.getUserByEmail(data.email);
    if (existing) {
      recordRouteMetric("POST /api/users", 409, Date.now() - startTime);
      return NextResponse.json(
        { error: "Email sudah digunakan oleh akun lain." },
        { status: 409, headers: { "X-Request-Id": requestId } }
      );
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

    logger.info(
      {
        event: "user_created",
        entryPoint: "api_users",
        requestId,
        userId: session.userId,
        createdUserId: newUser.id,
        createdUserRole: newUser.role,
        createdUserCity: newUser.city,
      },
      "New user account created by Super Admin"
    );
    recordRouteMetric("POST /api/users", 200, Date.now() - startTime);

    return NextResponse.json(
      {
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
      },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (err: unknown) {
    logger.error(
      {
        event: "user_create_error",
        entryPoint: "api_users",
        requestId,
        error: err instanceof Error ? err.message : String(err),
      },
      "Failed to create user account"
    );
    recordRouteMetric("POST /api/users", 500, Date.now() - startTime);
    return NextResponse.json(
      { error: "Gagal menambahkan pengguna baru." },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
