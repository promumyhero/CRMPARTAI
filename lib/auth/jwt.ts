import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "crmforu_super_secret_jwt_key_32chars_min_length_2026"
);

// Precomputed valid bcrypt hash used to prevent timing attacks when an email does not exist
export const DUMMY_PASSWORD_HASH = "$2b$10$e8Nsk78z3G03s.dSmjR4ee1R0gXzJm53lG0P38y80w6W5vUvL4v3y";

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  // Salt rounds 12 for strong security against GPU cracking
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createSessionToken(payload: TokenPayload, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role: payload.role,
      province: typeof payload.province === "string" ? payload.province : null,
      city: typeof payload.city === "string" ? payload.city : null,
      district: typeof payload.district === "string" ? payload.district : null,
    };
  } catch {
    return null;
  }
}
