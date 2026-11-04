import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";

interface UpdateBudgetItemPayload {
  category?: string;
  itemName?: string;
  qty?: number | string;
  unit?: string;
  unitPrice?: number | string;
  actualSubtotal?: number | string;
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "budget:edit")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = (await req.json()) as UpdateBudgetItemPayload;
    const updated = await DataService.updateBudgetItem(numId, body);
    if (!updated) {
      return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (err: unknown) {
    console.error("PUT /api/budget/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui pos anggaran." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session || !hasPermission(session.normalizedRole, "budget:edit")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const ok = await DataService.deleteBudgetItem(numId);
    if (!ok) {
      return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /api/budget/[id] error:", err);
    return NextResponse.json({ error: "Gagal menghapus pos anggaran." }, { status: 500 });
  }
}
