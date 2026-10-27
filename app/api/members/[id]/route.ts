import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getCurrentUserOrDefault } from "@/lib/auth/session";


export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUserOrDefault();
    const { id } = await params;
    const memberId = parseInt(id, 10);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const success = await DataService.deletePartyMember(memberId);
    if (!success) {

      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
