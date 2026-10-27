import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  convertMillimetersToTwip,
} from "docx";

export interface BudgetItemExport {
  id?: number;
  category: string;
  itemName: string;
  qty: number | string;
  unit: string;
  unitPrice: number | string;
  estimatedSubtotal: number | string;
  actualSubtotal?: number | string;
}

export interface DocxGenerateOptions {
  paperSize?: "A4" | "F4";
  showKop?: boolean;
  kopOrgName?: string;
  kopOrgSub?: string;
  kopAddress?: string;
  kopContact?: string;
  docNumber?: string;
  attachment?: string;
  subject?: string;
  dateStr?: string;
  city?: string;
  recipientName?: string;
  recipientLocation?: string;
  openingText?: string;
  bodyText?: string;
  closingText?: string;
  activityTitle?: string;
  activityDate?: string;
  activityTime?: string;
  activityLocation?: string;
  includeBudgetTable?: boolean;
  budgetItems?: BudgetItemExport[];
  totalEstimatedBudget?: number;
  totalActualBudget?: number;
  signerTitle?: string;
  signerName?: string;
  signerNip?: string;
}

const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};

const BORDERLESS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "CBD5E1",
};

const FULL_TABLE_BORDERS = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
};

export function formatRupiah(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num) || 0 : num;
  return "Rp " + n.toLocaleString("id-ID");
}

export async function generateOfficialDocx(options: DocxGenerateOptions): Promise<Buffer> {
  const isF4 = options.paperSize === "F4";
  
  // A4: 210mm x 297mm | F4 / Folio: 215mm x 330mm
  const pageWidthTwip = convertMillimetersToTwip(isF4 ? 215 : 210);
  const pageHeightTwip = convertMillimetersToTwip(isF4 ? 330 : 297);

  // Standard margins: Top 25mm, Bottom 25mm, Left 25mm, Right 20mm
  const marginTop = convertMillimetersToTwip(25);
  const marginBottom = convertMillimetersToTwip(25);
  const marginLeft = convertMillimetersToTwip(25);
  const marginRight = convertMillimetersToTwip(20);

  const paragraphsAndTables: (Paragraph | Table)[] = [];

  // ==========================================
  // 1. KOP SURAT (BORDERLESS GRID & BOTTOM LINE)
  // ==========================================
  if (options.showKop !== false && (options.kopOrgName || options.kopOrgSub)) {
    paragraphsAndTables.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: options.kopOrgSub ? options.kopOrgSub.toUpperCase() : "ORGANISASI / LEMBAGA",
            font: "Arial",
            size: 20, // 10pt
            bold: false,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: options.kopOrgName ? options.kopOrgName.toUpperCase() : "NAMA INSTANSI RESMI",
            font: "Arial",
            size: 28, // 14pt
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: options.kopAddress || "Jl. Contoh Alamat Kantor Resmi No. 123",
            font: "Arial",
            size: 18, // 9pt
          }),
          ...(options.kopContact
            ? [
                new TextRun({
                  text: " | Telp: " + options.kopContact,
                  font: "Arial",
                  size: 18,
                }),
              ]
            : []),
        ],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 18, // thick decorative line
            color: "0F172A",
            space: 4,
          },
        },
      }),
      // Spacer
      new Paragraph({ spacing: { before: 180 } })
    );
  }

  // ==============================================================
  // 2. METADATA SURAT (NOMOR, LAMPIRAN, PERIHAL & TANGGAL/KOTA)
  // DISUSUN MENGGUNAKAN BORDERLESS TABLE GRID AGAR TITIK DUA SEJAJAR
  // ==============================================================
  const docDateStr = options.dateStr || new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const cityStr = options.city || "Jakarta";

  const metaRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: "Nomor", font: "Times New Roman", size: 24 })] })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
        }),
        new TableCell({
          width: { size: 4500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: options.docNumber || "001/SEKR/X/2026", font: "Times New Roman", size: 24 }),
              ],
            }),
          ],
        }),
        // Sisi Kanan: Tempat & Tanggal Surat
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: `${cityStr}, ${docDateStr}`, font: "Times New Roman", size: 24 }),
              ],
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: "Lampiran", font: "Times New Roman", size: 24 })] })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
        }),
        new TableCell({
          width: { size: 4500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: options.attachment || (options.includeBudgetTable ? "1 (Satu) Berkas Rincian RAB" : "-"),
                  font: "Times New Roman",
                  size: 24,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: "Perihal", font: "Times New Roman", size: 24, bold: true })] })],
        }),
        new TableCell({
          width: { size: 300, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24, bold: true })] })],
        }),
        new TableCell({
          width: { size: 4500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: options.subject || "Permohonan / Undangan Kegiatan",
                  font: "Times New Roman",
                  size: 24,
                  bold: true,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          borders: BORDERLESS,
          children: [new Paragraph({ children: [] })],
        }),
      ],
    }),
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERLESS,
    rows: metaRows,
  });

  paragraphsAndTables.push(metaTable);

  // Spacer
  paragraphsAndTables.push(new Paragraph({ spacing: { before: 240 } }));

  // ==========================================
  // 3. PENERIMA SURAT (KEPADA YTH)
  // ==========================================
  paragraphsAndTables.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: "Kepada Yth.", font: "Times New Roman", size: 24 })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: options.recipientName || "Bapak / Ibu Pimpinan",
          font: "Times New Roman",
          size: 24,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: options.recipientLocation || "Di Tempat",
          font: "Times New Roman",
          size: 24,
        }),
      ],
    })
  );

  // ==========================================
  // 4. ISI SURAT (PEMBUKA, BODY, DETAIL)
  // ==========================================
  paragraphsAndTables.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: options.openingText || "Dengan hormat,",
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text:
            options.bodyText ||
            `Sehubungan dengan rencana pelaksanaan kegiatan ${options.activityTitle || "terkait"}, bersama ini kami sampaikan informasi dan permohonan sebagaimana tertera dalam rincian berikut:`,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    })
  );

  // Jika ada detail kegiatan:
  if (options.activityTitle || options.activityDate || options.activityLocation) {
    const detailRows = [
      ...(options.activityTitle
        ? [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 2200, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: "Nama Kegiatan", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 300, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 7500, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: options.activityTitle, font: "Times New Roman", size: 24, bold: true })] })],
                }),
              ],
            }),
          ]
        : []),
      ...(options.activityDate
        ? [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 2200, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: "Hari / Tanggal", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 300, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 7500, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: options.activityDate, font: "Times New Roman", size: 24 })] })],
                }),
              ],
            }),
          ]
        : []),
      ...(options.activityTime
        ? [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 2200, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: "Waktu", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 300, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 7500, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: options.activityTime, font: "Times New Roman", size: 24 })] })],
                }),
              ],
            }),
          ]
        : []),
      ...(options.activityLocation
        ? [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 2200, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: "Tempat / Lokasi", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 300, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: ":", font: "Times New Roman", size: 24 })] })],
                }),
                new TableCell({
                  width: { size: 7500, type: WidthType.DXA },
                  borders: BORDERLESS,
                  children: [new Paragraph({ children: [new TextRun({ text: options.activityLocation, font: "Times New Roman", size: 24 })] })],
                }),
              ],
            }),
          ]
        : []),
    ];

    paragraphsAndTables.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDERLESS,
        rows: detailRows,
      }),
      new Paragraph({ spacing: { before: 140 } })
    );
  }

  // ==============================================================
  // 5. TABEL RINCIAN ANGGARAN (JIKA DISETUJUI / INCLUDE BUDGET)
  // DILENGKAPI: tableHeader: true & cantSplit: true AGAR REPEAT HEADER
  // ==============================================================
  if (options.includeBudgetTable && options.budgetItems && options.budgetItems.length > 0) {
    paragraphsAndTables.push(
      new Paragraph({
        spacing: { before: 180, after: 120 },
        children: [
          new TextRun({
            text: "Rincian Rencana Anggaran Biaya (RAB):",
            font: "Times New Roman",
            size: 24,
            bold: true,
          }),
        ],
      })
    );

    const rabHeaderRow = new TableRow({
      tableHeader: true, // Auto repeat header across pages
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "No", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Kategori & Nama Item", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1200, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Volume", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1200, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Satuan", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2200, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Harga Satuan", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2500, type: WidthType.DXA },
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F1F5F9" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Total Estimasi", font: "Times New Roman", size: 20, bold: true })],
            }),
          ],
        }),
      ],
    });

    let calculatedTotal = 0;
    const rabDataRows = options.budgetItems.map((item, idx) => {
      const sub = typeof item.estimatedSubtotal === "string" ? parseFloat(item.estimatedSubtotal) || 0 : item.estimatedSubtotal;
      calculatedTotal += sub;

      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(idx + 1), font: "Times New Roman", size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3500, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: item.itemName, font: "Times New Roman", size: 20, bold: true }),
                  new TextRun({ text: ` (${item.category})`, font: "Times New Roman", size: 18, color: "64748B" }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: String(item.qty), font: "Times New Roman", size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: item.unit, font: "Times New Roman", size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: formatRupiah(item.unitPrice), font: "Times New Roman", size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            borders: FULL_TABLE_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: formatRupiah(sub), font: "Times New Roman", size: 20, bold: true })],
              }),
            ],
          }),
        ],
      });
    });

    // Total Row
    const totalRow = new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          columnSpan: 5,
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F8FAFC" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "TOTAL ANGGARAN:", font: "Times New Roman", size: 22, bold: true })],
            }),
          ],
        }),
        new TableCell({
          borders: FULL_TABLE_BORDERS,
          shading: { fill: "F8FAFC" },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: formatRupiah(options.totalEstimatedBudget ?? calculatedTotal),
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                  color: "1E40AF",
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const rabTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: FULL_TABLE_BORDERS,
      rows: [rabHeaderRow, ...rabDataRows, totalRow],
    });

    paragraphsAndTables.push(rabTable, new Paragraph({ spacing: { before: 140 } }));
  }

  // ==========================================
  // 6. PENUTUP SURAT
  // ==========================================
  paragraphsAndTables.push(
    new Paragraph({
      spacing: { before: 120, after: 360 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text:
            options.closingText ||
            "Demikian surat ini kami sampaikan, atas perhatian dan kerjasama yang baik dari Bapak/Ibu kami ucapkan terima kasih.",
          font: "Times New Roman",
          size: 24,
        }),
      ],
    })
  );

  // ==============================================================
  // 7. AREA TANDA TANGAN (INVISIBLE GRID AGAR TIDAK BERGESER SAAT DIEDIT)
  // ==============================================================
  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERLESS,
    rows: [
      new TableRow({
        children: [
          // Kolom Kiri: Mengetahui / PIC
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: BORDERLESS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Mengetahui,",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 720 }, // Ruang tanda tangan ~3 baris
                children: [
                  new TextRun({
                    text: "Penanggung Jawab Kegiatan",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "( ................................................ )",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
          // Kolom Kanan: Pejabat / Pimpinan Penandatangan
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: BORDERLESS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: options.signerTitle || "Hormat Kami,",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 720 }, // Ruang tanda tangan ~3 baris
                children: [
                  new TextRun({
                    text: options.kopOrgName ? "Ketua / Pimpinan" : "",
                    font: "Times New Roman",
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: options.signerName || "Nama Pejabat Penandatangan",
                    font: "Times New Roman",
                    size: 24,
                    bold: true,
                    underline: {},
                  }),
                ],
              }),
              ...(options.signerNip
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: `NIP. ${options.signerNip}`,
                          font: "Times New Roman",
                          size: 20,
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  });

  paragraphsAndTables.push(signatureTable);

  // Buat Dokumen OpenXML
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidthTwip,
              height: pageHeightTwip,
            },
            margin: {
              top: marginTop,
              bottom: marginBottom,
              left: marginLeft,
              right: marginRight,
            },
          },
        },
        children: paragraphsAndTables,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
