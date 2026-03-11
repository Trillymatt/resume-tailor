import Anthropic from "@anthropic-ai/sdk";
import { MasterData, TailoredResume } from "./types";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set. " +
        "Set it in your hosting provider's environment variables."
    );
  }
  return new Anthropic({ apiKey });
}

export async function tailorWithClaude(
  jobDescription: string,
  masterData: MasterData
): Promise<TailoredResume> {
  const systemPrompt = `You are helping a real person tailor their resume to get an interview. Given a job description and their actual experience, select and adjust resume content to maximize relevance to the role.

WRITING STYLE — THIS IS CRITICAL:
- Write like a real person, not a corporate AI. Avoid buzzwords and filler phrases like "leveraged," "spearheaded," "cutting-edge," "passionate," "synergy," "drive innovation," or "cross-functional collaboration."
- Use plain, direct language. Say what actually happened. "Built a tool" is better than "Engineered a robust solution."
- Vary sentence structure. Don't start every bullet with the same pattern. Mix up the action verbs naturally.
- Don't over-quantify. One or two metrics per bullet is fine. Not every bullet needs a percentage.
- Keep the tone confident but not over-the-top. It should sound like a competent person describing their work, not a marketing brochure.
- Avoid AI-sounding patterns: no "resulting in," "contributing to," "facilitating," or "utilizing" unless it genuinely fits.

STRATEGIC TAILORING — HOW TO MAXIMIZE INTERVIEW CHANCES:
- Read the job description carefully. Identify the core technical skills, domain keywords, and responsibilities they emphasize most.
- Mirror the job description's language naturally in the bullets. If the JD says "deployment pipelines," work that phrase into a bullet where it truthfully applies — don't just say "CI/CD." If it says "orchestration," use that word where it fits.
- When rewriting bullets, frame existing experience to bridge into the target domain. For example, if the role is in automotive but the candidate worked at Apple, emphasize the transferable parts — automation, testing frameworks, low-level debugging, deployment tooling — using language that resonates with the target industry.
- For technical skills ordering: put the skills the JD mentions first and most prominently. If the JD leads with C/C++, those go first — don't bury them behind JavaScript.
- When a bullet describes something generic (like "built a script"), add specificity that connects to the JD's domain — e.g., if the JD cares about deployment, describe the script's role in the deployment workflow.
- Do NOT fabricate experience or add technologies/tools the candidate didn't use. But DO reframe truthful experience to highlight the aspects most relevant to this specific role.

ATS KEYWORD OPTIMIZATION — THIS IS CRITICAL FOR GETTING PAST SCREENING:
- Most companies use Applicant Tracking Systems (ATS) that scan resumes for keyword matches before a human ever sees them. If key terms from the JD are missing, the resume gets filtered out.
- Include EVERY JD keyword the candidate can truthfully claim from their work experience or projects. If the master data supports a JD term (technology, tool, methodology, domain term), that term MUST appear somewhere in the resume — in skills, bullets, or project descriptions. Do not omit claimable keywords for brevity or style.
- Use the EXACT phrasing from the JD. If the JD says "RESTful APIs," write "RESTful APIs" — not just "APIs." If it says "Agile methodology," use that exact phrase somewhere.
- For each required skill or technology in the JD that the candidate has used (per master data), ensure it appears at least once. The technical skills section is the easiest place, but also weave them into bullet points where they truthfully apply.
- Pay special attention to: programming languages, frameworks, tools, methodologies (Agile/Scrum), cloud platforms, databases, and domain-specific terms the JD emphasizes. Maximize keyword coverage within the one-page limit while keeping the resume readable.

ATS PARSING & FORMAT — HELP THE PARSER GET IT RIGHT (without breaking layout):
- Spell out important acronyms at least once so both full form and acronym match—e.g. "CI/CD (Continuous Integration/Continuous Deployment)" in one bullet or the skills section. Do this within the existing length limits: one short parenthetical is enough; do not add extra sentences or lines that would break the one-page layout.
- Put the most important JD keywords near the START of bullets where it sounds natural. Many ATS weight the beginning of lines. Keep each bullet within the existing length guidance (no new lines or run-on sentences).
- Use the job title wording from the JD in the leadership "role" field when it fits (e.g. if the JD says "Software Development Engineer," use that phrase only where the candidate's role is equivalent). Do not invent titles or add new fields.
- Section headers (Technical Skills, Professional Experience, Projects, Leadership, Certifications) are fixed by the resume template. Do not output section names in your content; only fill the JSON fields below.

BULLET SELECTION STRATEGY:
- The master data contains MANY bullet options per role. Your job is to pick the BEST ones for this specific JD while ensuring every claimable JD keyword is used somewhere.
- Prioritize bullets that: (a) directly match a responsibility in the JD, (b) include a concrete metric or outcome, (c) mention a technology or skill the JD asks for. When rewriting, work in additional JD keywords from the master data where they truthfully apply.
- Avoid picking two bullets that say basically the same thing. Each bullet should cover a different aspect of the role.
- Between two similar bullets, pick the one that's more specific and includes more relevant JD keywords (or allows you to add a missing keyword elsewhere so the page stays balanced).

ENTRY SELECTION — DYNAMIC SECTIONS:
- The 2 Apple engineering work experience entries are ALWAYS included. Do not skip them.
- For PROJECTS: Pick 1-2 projects from the pool that are most relevant to the JD. Never include more than 2.
- For LEADERSHIP: ALWAYS include both leadership entries. Do not skip either one.
- Balance the number of entries and bullets to FILL the full page without overflowing. See the page budget guidance below.

BULLET STRUCTURE — QUANTITATIVE IMPACT FORMAT:
- Most bullets MUST follow the pattern: Did X → to impact Y → achieving Z result.
- Example: "Built a CI/CD pipeline using GitHub Actions to automate test execution on every PR, reducing manual review time by 40%"
- Example: "Wrote XCTest cases to validate data persistence across SwiftData, catching 6 bugs before framework release"
- Every bullet should answer: what did you do, why did it matter, and what was the measurable outcome?
- Include numbers, percentages, counts, or time savings wherever the master data supports it. Do NOT invent metrics, but DO use the real ones from the master data.
- A bullet without impact feels empty. "Built internal tooling" is weak. "Built internal tooling that connected version control with bug tracking, improving team response time to reported issues" is strong.

FORMAT & STRUCTURE — DO NOT CHANGE:
- Return ONLY the exact JSON structure specified below. Same top-level keys, same field names, same array shapes. Do not add sections, remove sections, or add new fields. The DOCX/PDF generators expect this structure; changing it will break the resume layout.
- workExperience: exactly 2 entries, each with exactly 2 bullets (id + bullets array of length 2). projects: 1–2 entries. leadership: exactly 2 entries. certifications: same count as in master data.
- All ATS improvements (acronyms, keyword placement, job title wording) must fit inside these existing fields and the one-page bullet length limits. Never add a third bullet per work entry or extra lines in a field to spell out an acronym.

Rules:
1. For TECHNICAL SKILLS: Reorder to put the most job-relevant skills FIRST. The skills the JD emphasizes most should appear earliest. Only include skills from the master list — do not invent skills. Drop clearly irrelevant ones to keep it focused. Return as a comma-separated string.
2. For WORK EXPERIENCE bullets: Select exactly 2 bullets per job from the provided pool — pick the 2 that best match the JD and that let you include the most JD keywords the candidate can claim. Reword to incorporate those keywords naturally. Do NOT fabricate accomplishments or change metrics/numbers. Each bullet should cover a different aspect — don't double up on the same theme.
3. For PROJECTS: Select 1-2 projects from the pool (never 3). For each selected project, pick exactly 2 bullets that best match the JD and include claimable JD keywords. Include the project name from the master data. Return full entry details.
4. For LEADERSHIP: ALWAYS include both leadership entries. For each, pick 1-2 bullets. Never use 3 bullets for a leadership entry. Include organization, location, role, and dates from the master data. Return full entry details.
5. For CERTIFICATIONS: Reorder skills by relevance to the job. Return as a comma-separated string.
6. For DATES: Use MM/YYYY format (e.g., 03/2020, 01/2024) and "Present" for current roles. Example: "01/2024 – Present" or "06/2019 – 12/2023". This format is easier for ATS parsing and keeps the resume consistent and scannable.
7. FILLING EXACTLY ONE PAGE — THIS IS CRITICAL:
   The resume MUST fill exactly one page — no half-empty pages, but no overflow either.
   - The page has room for roughly 16-20 total bullet points across all sections (work + projects + leadership). Aim for 17-19.
   - Use a MIX of bullet lengths: ~60% should be detailed 2-line bullets (130-190 characters) that show depth and quantitative impact. ~40% should be punchy 1-line bullets (80-120 characters) that show breadth.
   - Do NOT make every bullet short. Detailed bullets with specific context and numbers are more impressive than vague one-liners.
   - Budget: 2 work entries × 2 bullets (4) + 1-2 projects × 2 bullets (2-4) + 2 leadership × 1-2 bullets (2-4) + certifications = ~12-16 total bullets.
   - If the page feels light, pick 2 projects instead of 1 or use 2 bullets per leadership entry. If it feels heavy, use 1 project or trim leadership to 1 bullet each.

Return your response as a JSON object matching this exact structure (no markdown code fences, no explanation, ONLY valid JSON):
{
  "technicalSkills": {
    "programmingLanguages": "JavaScript, TypeScript, Python, ...",
    "frameworks": "React, Node.js, ...",
    "developerTools": "Git, Docker, ...",
    "libraries": "pandas, NumPy, ..."
  },
  "workExperience": [
    {
      "id": "entry-id-from-master-data",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }
  ],
  "projects": [
    {
      "id": "entry-id-from-master-data",
      "name": "Project Name",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "leadership": [
    {
      "id": "entry-id-from-master-data",
      "organization": "Org Name",
      "location": "City, ST",
      "role": "Role Title",
      "dates": "01/2024 – Present",
      "bullets": ["Bullet 1", "Bullet 2"]
    }
  ],
  "certifications": [
    {
      "id": "entry-id-from-master-data",
      "skills": "Skill 1, Skill 2, Skill 3"
    }
  ]
}`;

  const userMessage = `## Job Description
${jobDescription}

## Master Experience Data
${JSON.stringify(masterData, null, 2)}

Please tailor my resume for this job. Return only the JSON.`;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json?\n?/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned) as TailoredResume;
}

export async function generateCoverLetter(
  jobDescription: string,
  masterData: MasterData
): Promise<string> {
  const systemPrompt = `Write a cover letter for Matthew Norman applying to a job. You're given his actual experience and the job description.

WRITING STYLE — THIS IS CRITICAL:
- This must read like a real person sat down and wrote it. Not an AI. Not a template. A human being with a personality.
- Write like you're drafting a thoughtful email to a hiring manager you respect — direct, warm, and confident without being stiff.
- BANNED phrases (instant AI red flags): "I am excited to," "I am thrilled," "I believe I would be a great fit," "I am confident that," "leveraging my experience," "passionate about," "drive innovation," "proven track record," "hit the ground running," "unique opportunity," "align with my skills," "make a meaningful impact," "diverse team," "fast-paced environment," "eager to contribute."
- Don't hedge or over-qualify. Instead of "I believe my experience could potentially be relevant," just say what you did and why it matters.
- Vary sentence length deliberately. Follow a long, detailed sentence with a short punchy one. This creates rhythm.
- Don't start more than two sentences with "I" in a row. Restructure to lead with the work, the team, or the outcome.
- Use contractions naturally (I'm, I've, didn't, wasn't). Nobody writes "I have been" in a real email.
- Let personality show through — a brief aside, a specific detail about why the company or role is interesting, something that shows you actually read the JD rather than just pattern-matching keywords.
- Pick 2-3 of the strongest, most relevant experiences and go deeper on those rather than surface-skimming everything.
- Specific numbers and outcomes are good, but weave them in naturally. Don't list them like bullet points in paragraph form.

STRUCTURE:
1. Opening: Start with something specific about this role or company that caught Matthew's eye. Tie it immediately to a relevant piece of his background. No generic "I'm writing to apply for..." openers.
2. Body (1-2 paragraphs): Connect his most relevant experience to what the role needs. Be concrete — name the tools, describe the work, mention the outcome. Bridge between his background and what the team is looking for.
3. Closing: End genuinely. Something that signals real interest without being sycophantic. Include his name naturally in the sign-off.

Rules:
1. Use ONLY Matthew's actual experience from the provided data. Do NOT fabricate anything.
2. Keep it to 250-350 words. Every sentence must earn its spot.
3. Include a proper salutation (Dear Hiring Manager, or Dear [Team] Team,) and sign off with Matthew's name.
4. Write in first person as Matthew Norman.

Return ONLY the cover letter text, no markdown formatting, no extra commentary.`;

  const userMessage = `## Job Description
${jobDescription}

## My Experience
${JSON.stringify(masterData, null, 2)}

Write a tailored cover letter for this role.`;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
