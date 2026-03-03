import { NextRequest, NextResponse } from "next/server";
import { generateDocx } from "@/lib/docx-generator";
import { TailoredResume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const tailored: TailoredResume = await req.json();
    const docxBuffer = await generateDocx(tailored);

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="tailored-resume.docx"',
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate resume document" },
      { status: 500 }
    );
  }
}
