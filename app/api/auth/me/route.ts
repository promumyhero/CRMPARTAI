import { NextResponse } from "next/server";
import { COOKIE_NAME, SECURE_COOKIE_OPTIONS, getSessionUser } from "@/lib/auth/session";
import { DataService } from "@/lib/services/data-store";
import { normalizeRole } from "@/lib/auth/roles";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  // Ambil profil data user terbaru dari database
  const user = await DataService.getUserById(session.userId);
  if (!user || user.status === "suspended") {
    const res = NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
    res.cookies.set({
      name: COOKIE_NAME,
      value: "",
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.json(
    {
      authenticated: true,
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
        lastLoginAt: user.lastLoginAt,
      },
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
