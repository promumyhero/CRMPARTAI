import { NextResponse } from "next/server";
import { DataService } from "@/lib/services/data-store";

interface CreateBudgetItemPayload {
  activityId?: number | string;
  category?: string;
  itemName?: string;
  qty?: number | string;
  unit?: string;
  unitPrice?: number | string;
  actualSubtotal?: number | string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activityIdStr = searchParams.get("activityId");
    if (!activityIdStr) {
      return NextResponse.json({ error: "activityId is required" }, { status: 400 });
    }

    const activityId = parseInt(activityIdStr, 10);
    const items = await DataService.getBudgetItems(activityId);

    let totalEstimated = 0;
    let totalActual = 0;
    for (const it of items) {
      totalEstimated += parseFloat(it.estimatedSubtotal) || 0;
      totalActual += parseFloat(it.actualSubtotal) || 0;
    }

    const variance = totalEstimated - totalActual;

    return NextResponse.json({
      items,
      summary: {
        totalEstimated,
        totalActual,
        variance,
        isDeficit: variance < 0,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching budget";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBudgetItemPayload;
    if (!body.activityId || !body.itemName || !body.category || !body.unit) {
      return NextResponse.json(
        { error: "Activity ID, nama item, kategori, dan satuan wajib diisi." },
        { status: 400 }
      );
    }

    const item = await DataService.createBudgetItem({
      activityId: Number(body.activityId),
      category: body.category,
      itemName: body.itemName,
      qty: body.qty ?? 1,
      unit: body.unit,
      unitPrice: body.unitPrice ?? 0,
      actualSubtotal: body.actualSubtotal ?? 0,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating budget item";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
