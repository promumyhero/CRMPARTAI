import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "CRMForU • Activity Planner, Budget Planning & Document Generator",
  description:
    "Sistem terintegrasi perencanaan kegiatan, anggaran belanja (RAB), dan pembuatan dokumen surat resmi Microsoft Word (.docx) berbasis native OpenXML.",
  keywords: [
    "Activity Planner",
    "Budget Planning",
    "RAB",
    "Word Generator",
    "docx",
    "OpenXML",
    "Surat Resmi",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        >
          Lewati ke konten utama
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
