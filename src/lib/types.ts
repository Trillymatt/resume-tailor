export interface MasterData {
  technicalSkills: {
    programmingLanguages: string[];
    frameworks: string[];
    developerTools: string[];
    libraries: string[];
  };
  workExperience: WorkEntry[];
  projects: ProjectEntry[];
  leadership: LeadershipEntry[];
  certifications: CertificationEntry[];
}

export interface WorkEntry {
  id: string;
  company: string;
  location: string;
  title: string;
  dates: string;
  bullets: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  bullets: string[];
}

export interface LeadershipEntry {
  id: string;
  organization: string;
  location: string;
  role: string;
  dates: string;
  bullets: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  date: string;
  skills: string[];
}

export interface TailoredResume {
  technicalSkills: {
    programmingLanguages: string;
    frameworks: string;
    developerTools: string;
    libraries: string;
  };
  workExperience: {
    id: string;
    bullets: string[];
  }[];
  projects: {
    id: string;
    name: string;
    bullets: string[];
  }[];
  leadership: {
    id: string;
    organization: string;
    location: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
  certifications: {
    id: string;
    skills: string;
  }[];
}
