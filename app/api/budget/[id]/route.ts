import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";

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
    const msg = err instanceof Error ? err.message : "Error updating budget item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
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
    const msg = err instanceof Error ? err.message : "Error deleting budget item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
