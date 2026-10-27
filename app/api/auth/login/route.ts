import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { comparePassword, createSessionToken, DUMMY_PASSWORD_HASH } from "@/lib/auth/jwt";
import { COOKIE_NAME, SECURE_COOKIE_OPTIONS } from "@/lib/auth/session";
import { checkLoginRateLimit, recordFailedLogin, resetLoginRateLimit } from "@/lib/auth/rate-limit";
import { LoginInputSchema } from "@/lib/auth/validation";
import { normalizeRole } from "@/lib/auth/roles";

export async function POST(req: Request) {
  try {
    // 1. Dapatkan IP address untuk rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    // 2. Parse & Validasi payload dengan Zod (Anti Injection & Malformed input)
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
    }

    const parseResult = LoginInputSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Data input tidak valid.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, password, rememberMe } = parseResult.data;
    const rateLimitKey = `${ip}:${email}`;

    // 3. Periksa Brute-Force Rate Limit
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60);
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login yang gagal. Akun sementara diblokir demi keamanan. Silakan coba lagi dalam ${minutes} menit.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 900),
          },
        }
      );
    }

    // 4. Cari pengguna di database (Parameterized query aman dari SQL Injection)
    const user = await DataService.getUserByEmail(email);

    // 5. Mitigasi Timing Attack: Selalu jalankan komparasi bcrypt bahkan jika email tidak ditemukan
    if (!user) {
      await comparePassword(password, DUMMY_PASSWORD_HASH);
      const failResult = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          error: "Email atau kata sandi tidak valid.",
          remainingAttempts: failResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 6. Cek status akun pengguna
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan oleh Administrator. Hubungi pimpinan DPD." },
        { status: 403 }
      );
    }

    // 7. Verifikasi kecocokan password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const failResult = recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          error: "Email atau kata sandi tidak valid.",
          remainingAttempts: failResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 8. Berhasil login: Reset counter rate limit
    resetLoginRateLimit(rateLimitKey);

    // 9. Catat waktu login terakhir
    await DataService.recordLogin(user.id);

    // 10. Buat JWT Token aman
    const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 hari vs 7 hari
    const token = await createSessionToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        province: user.province || null,
        city: user.city || null,
        district: user.district || null,
      },
      rememberMe ? "30d" : "7d"
    );

    // 11. Format response & pasang HttpOnly Secure Cookie
    const response = NextResponse.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        normalizedRole: normalizeRole(user.role),
        phone: user.phone,
        province: user.province,
        city: user.city,
        district: user.district,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      ...SECURE_COOKIE_OPTIONS,
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err: unknown) {
    console.error("Login exception:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server autentikasi." },
      { status: 500 }
    );
  }
}
