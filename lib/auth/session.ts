import { cookies } from "next/headers";
import { verifySessionToken, type TokenPayload } from "./jwt";

export const COOKIE_NAME = "crmforu_session";

export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Returns current session user or default admin user for initial development
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
  // Default fallback user
  return {
    id: 1,
    email: "admin@crmforu.com",
    name: "Administrator Utama",
    role: "admin",
  };
}
