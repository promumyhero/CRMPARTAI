import { NextResponse } from "next/server";
import { generateOfficialDocx, type DocxGenerateOptions } from "@/lib/docx/generator";
import { DataService } from "@/lib/services/data-store";

type ExportPayload = DocxGenerateOptions & {
  activityId?: number;
  documentId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExportPayload;

    if (body.activityId && (!body.budgetItems || body.budgetItems.length === 0)) {
      const bItems = await DataService.getBudgetItems(body.activityId);
      body.budgetItems = bItems.map((b) => ({
        category: b.category,
        itemName: b.itemName,
        qty: b.qty,
        unit: b.unit,
        unitPrice: b.unitPrice,
        estimatedSubtotal: b.estimatedSubtotal,
        actualSubtotal: b.actualSubtotal,
      }));

      const act = await DataService.getActivityById(body.activityId);
      if (act) {
        if (!body.activityTitle) body.activityTitle = act.title;
        if (!body.activityLocation) body.activityLocation = act.location || undefined;
        if (!body.activityDate && act.startDate) {
          body.activityDate = new Date(act.startDate).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
        body.totalEstimatedBudget = parseFloat(act.totalEstimatedBudget) || 0;
        body.totalActualBudget = parseFloat(act.totalActualBudget) || 0;
      }
    }

    const docxBuffer = await generateOfficialDocx(body);

    const safeSubject = (body.subject || "Surat_Resmi").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeSubject}_${new Date().toISOString().split("T")[0]}.docx`;

    const docxUint8 = new Uint8Array(docxBuffer);

    return new NextResponse(docxUint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": docxBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate .docx document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
