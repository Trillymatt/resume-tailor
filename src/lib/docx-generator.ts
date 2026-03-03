import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { TailoredResume } from "./types";

const TEMPLATE_PATH = path.join(process.cwd(), "data", "resume-template.docx");

export async function generateDocx(tailored: TailoredResume): Promise<Buffer> {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Build data object mapping placeholders to tailored content
  const data: Record<string, unknown> = {
    programmingLanguages: tailored.technicalSkills.programmingLanguages,
    frameworks: tailored.technicalSkills.frameworks,
    developerTools: tailored.technicalSkills.developerTools,
    libraries: tailored.technicalSkills.libraries,
  };

  const WORK_BULLETS_PER_ENTRY = 2;
  tailored.workExperience.forEach((entry, i) => {
    for (let j = 0; j < WORK_BULLETS_PER_ENTRY; j++) {
      data[`work${i}_bullet${j}`] = entry.bullets[j] ?? "";
    }
  });

  // Projects — passed as array for {#projects}...{/projects} loop
  data.projects = tailored.projects.map((entry) => ({
    name: entry.name,
    bullets: entry.bullets,
  }));

  // Leadership — passed as array for {#leadership}...{/leadership} loop
  data.leadership = tailored.leadership.map((entry) => ({
    organization: entry.organization,
    location: entry.location,
    role: entry.role,
    dates: entry.dates,
    bullets: entry.bullets,
  }));

  // Certification skills (flat placeholders)
  tailored.certifications.forEach((entry, i) => {
    data[`cert${i}_skills`] = entry.skills;
  });

  doc.render(data);

  const outputBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return outputBuffer;
}
