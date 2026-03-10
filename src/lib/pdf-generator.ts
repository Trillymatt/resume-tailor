import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { promisify } from "util";
import { TailoredResume } from "./types";
import { generateDocx } from "./docx-generator";

const execAsync = promisify(exec);

export async function generatePdf(tailored: TailoredResume): Promise<Buffer> {
  // Generate DOCX first
  const docxBuffer = await generateDocx(tailored);

  // Write DOCX to a temp file
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-pdf-"));
  const docxPath = path.join(tmpDir, "resume.docx");
  const pdfPath = path.join(tmpDir, "resume.pdf");

  try {
    await fs.writeFile(docxPath, docxBuffer);

    // Convert using LibreOffice
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`,
      { timeout: 30000 }
    );

    const pdfBuffer = await fs.readFile(pdfPath);
    return pdfBuffer;
  } finally {
    // Clean up temp files
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
