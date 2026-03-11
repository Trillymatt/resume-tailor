import { PDFDocument, StandardFonts } from "pdf-lib";
import { TailoredResume } from "./types";

const MARGIN = 50;
const LINE_HEIGHT = 14;
const SECTION_GAP = 8;
const BULLET_INDENT = 15;
const MAX_WIDTH = 495; // letter width 612 - 2*MARGIN minus some padding

/** Wrap text into lines that fit within maxWidth. Returns array of lines. */
function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(candidate, fontSize);
    if (w <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generatePdf(tailored: TailoredResume): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);
  const { height } = page.getSize();

  let y = height - MARGIN;
  let currentPage = page;

  const drawLine = (str: string, opts: { bold?: boolean; indent?: number } = {}) => {
    const f = opts.bold ? fontBold : font;
    const size = opts.bold ? 11 : 10;
    const x = MARGIN + (opts.indent ?? 0);
    const lines = wrapText(str, f, size, MAX_WIDTH - (opts.indent ?? 0));
    for (const line of lines) {
      if (y < MARGIN + 20) {
        const newPage = doc.addPage([612, 792]);
        currentPage = newPage;
        y = height - MARGIN;
      }
      currentPage.drawText(line, { x, y, size, font: f });
      y -= LINE_HEIGHT;
    }
  };

  const section = (title: string) => {
    y -= SECTION_GAP;
    drawLine(title, { bold: true });
    y -= 4;
  };

  // Technical Skills
  section("Technical Skills");
  drawLine(`Programming: ${tailored.technicalSkills.programmingLanguages}`);
  drawLine(`Frameworks: ${tailored.technicalSkills.frameworks}`);
  drawLine(`Tools: ${tailored.technicalSkills.developerTools}`);
  drawLine(`Libraries: ${tailored.technicalSkills.libraries}`);
  y -= 4;

  // Professional Experience
  section("Professional Experience");
  for (const entry of tailored.workExperience) {
    for (const bullet of entry.bullets) {
      if (!bullet.trim()) continue;
      drawLine(`• ${bullet}`, { indent: BULLET_INDENT });
    }
    y -= 2;
  }

  // Projects
  if (tailored.projects.length > 0) {
    section("Projects");
    for (const proj of tailored.projects) {
      drawLine(proj.name, { bold: true });
      for (const bullet of proj.bullets) {
        if (!bullet.trim()) continue;
        drawLine(`• ${bullet}`, { indent: BULLET_INDENT });
      }
      y -= 2;
    }
  }

  // Leadership
  if (tailored.leadership.length > 0) {
    section("Leadership");
    for (const lead of tailored.leadership) {
      drawLine(`${lead.role}, ${lead.organization} — ${lead.dates}`, { bold: true });
      drawLine(lead.location);
      for (const bullet of lead.bullets) {
        if (!bullet.trim()) continue;
        drawLine(`• ${bullet}`, { indent: BULLET_INDENT });
      }
      y -= 2;
    }
  }

  // Certifications
  if (tailored.certifications.length > 0) {
    section("Certifications");
    for (const cert of tailored.certifications) {
      drawLine(cert.skills);
    }
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
