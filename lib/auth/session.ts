import { cookies } from "next/headers";
import { verifySessionToken, type TokenPayload } from "./jwt";
import { normalizeRole, hasPermission, type Permission } from "./roles";

export const COOKIE_NAME = "crmforu_session";

export interface SessionUser extends TokenPayload {
  normalizedRole: string;
}

export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload) return null;

    return {
      ...payload,
      normalizedRole: normalizeRole(payload.role),
    };
  } catch {
    return null;
  }
}

/**
 * Returns current session user or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Returns current session user or fallback default user for backward-compatible routes
 */
export async function getCurrentUserOrDefault(): Promise<{
  id: number;
  email: string;
  name: string;
  role: string;
}> {
  const session = await getSessionUser();
  if (session) {
    return {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    };
  }
  return {
    id: 1,
    email: "admin@crmforu.com",
    name: "Administrator Utama",
    role: "superadmin",
  };
}

/**
 * Cek apakah session saat ini memiliki izin tertentu
 */
export async function currentUserCan(permission: Permission): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return hasPermission(user.normalizedRole, permission);
}
