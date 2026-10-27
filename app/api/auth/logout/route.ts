import { NextResponse } from "next/server";
import { COOKIE_NAME, SECURE_COOKIE_OPTIONS } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesi berhasil diakhiri." });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    ...SECURE_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
