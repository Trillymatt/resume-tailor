import { TailoredResume, KeywordAnalysis } from "./types";

// Common filler words to ignore when extracting keywords
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "must",
  "about", "above", "after", "again", "all", "also", "am", "any", "as",
  "both", "each", "few", "get", "got", "he", "her", "here", "him", "his",
  "how", "i", "if", "into", "it", "its", "just", "let", "like", "make",
  "me", "more", "most", "my", "no", "nor", "not", "now", "of", "off",
  "old", "once", "only", "other", "our", "out", "over", "own", "per",
  "put", "said", "same", "she", "so", "some", "such", "take", "than",
  "that", "their", "them", "then", "there", "these", "they", "this",
  "those", "through", "too", "under", "up", "us", "use", "very", "want",
  "way", "we", "well", "what", "when", "where", "which", "while", "who",
  "whom", "why", "work", "working", "you", "your", "etc", "including",
  "ability", "strong", "experience", "team", "role", "position",
  "required", "preferred", "requirements", "qualifications", "responsible",
  "responsibilities", "years", "year", "job", "description", "company",
  "based", "looking", "join", "opportunity", "candidate", "ideal",
  "apply", "application", "equal", "employer", "benefits", "salary",
  "new", "using", "across", "within", "between",
]);

// Technical terms / multi-word phrases to look for as a unit
const TECH_PHRASES = [
  "machine learning", "deep learning", "natural language processing",
  "computer vision", "data science", "data engineering", "data pipeline",
  "ci/cd", "ci cd", "continuous integration", "continuous deployment",
  "unit testing", "integration testing", "end to end", "e2e",
  "version control", "source control", "pull request",
  "rest api", "restful api", "graphql api",
  "object oriented", "design patterns", "system design",
  "cloud computing", "distributed systems", "microservices",
  "agile", "scrum", "kanban", "sprint",
  "full stack", "front end", "back end", "frontend", "backend",
  "mobile development", "ios development", "android development",
  "test driven", "behavior driven",
  "project management", "product management",
  "supply chain", "customer facing",
];

/**
 * Extract meaningful keywords and phrases from a job description.
 * Returns deduplicated, lowercased terms sorted by relevance.
 */
export function extractKeywords(jobDescription: string): string[] {
  const jdLower = jobDescription.toLowerCase();
  const found = new Set<string>();

  // First pass: extract multi-word technical phrases
  for (const phrase of TECH_PHRASES) {
    if (jdLower.includes(phrase)) {
      found.add(phrase);
    }
  }

  // Second pass: extract individual technical/meaningful words
  // Split on non-alphanumeric (keeping + and # for C++, C#, etc.)
  const words = jdLower.match(/[a-z0-9#+.]+/g) || [];

  for (const word of words) {
    if (word.length < 2) continue;
    if (STOP_WORDS.has(word)) continue;
    // Skip pure numbers
    if (/^\d+$/.test(word)) continue;
    found.add(word);
  }

  return Array.from(found);
}

/**
 * Build a single string of all resume text content for keyword matching.
 */
function getResumeText(resume: TailoredResume): string {
  const parts: string[] = [];

  // Skills
  parts.push(resume.technicalSkills.programmingLanguages);
  parts.push(resume.technicalSkills.frameworks);
  parts.push(resume.technicalSkills.developerTools);
  parts.push(resume.technicalSkills.libraries);

  // Work bullets
  for (const entry of resume.workExperience) {
    parts.push(...entry.bullets);
  }

  // Project bullets
  for (const entry of resume.projects) {
    parts.push(entry.name);
    parts.push(...entry.bullets);
  }

  // Leadership bullets
  for (const entry of resume.leadership) {
    parts.push(entry.organization);
    parts.push(entry.role);
    parts.push(...entry.bullets);
  }

  // Certification skills
  for (const entry of resume.certifications) {
    parts.push(entry.skills);
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Analyze how well a tailored resume matches keywords from the job description.
 */
export function analyzeKeywordMatch(
  jobDescription: string,
  resume: TailoredResume
): KeywordAnalysis {
  const keywords = extractKeywords(jobDescription);
  const resumeText = getResumeText(resume);

  const matched: string[] = [];
  const missed: string[] = [];

  for (const keyword of keywords) {
    if (resumeText.includes(keyword)) {
      matched.push(keyword);
    } else {
      missed.push(keyword);
    }
  }

  const score = keywords.length > 0
    ? Math.round((matched.length / keywords.length) * 100)
    : 0;

  return {
    score,
    matched,
    missed,
    total: keywords.length,
  };
}
