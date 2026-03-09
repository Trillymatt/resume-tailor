import { NextRequest, NextResponse } from "next/server";
import { generatePdf } from "@/lib/pdf-generator";
import { TailoredResume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const tailored: TailoredResume = await req.json();
    const pdfBuffer = await generatePdf(tailored);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="tailored-resume.pdf"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("PDF download error:", message, error);
    return NextResponse.json(
      { error: "Failed to generate PDF resume", detail: message },
      { status: 500 }
    );
  }
}
