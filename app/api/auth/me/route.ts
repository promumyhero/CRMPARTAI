import { NextResponse } from "next/server";
import { getSessionUser, getCurrentUserOrDefault } from "@/lib/auth/session";

export async function GET() {
  const session = await getSessionUser();
  if (session) {
    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  }
  // If not logged in, provide default user preview
  const defaultUser = await getCurrentUserOrDefault();
  return NextResponse.json({
    authenticated: false,
    user: defaultUser,
  });
}
