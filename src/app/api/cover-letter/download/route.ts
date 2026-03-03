import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "data",
  "cover-letter-template.docx"
);

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Cover letter text is required" },
        { status: 400 }
      );
    }

    const templateBuffer = await fs.readFile(TEMPLATE_PATH);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({ content: text });

    const outputBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          'attachment; filename="cover-letter.docx"',
      },
    });
  } catch (error) {
    console.error("Cover letter download error:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter document" },
      { status: 500 }
    );
  }
}
