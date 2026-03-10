import { NextRequest, NextResponse } from "next/server";
import { analyzeKeywordMatch } from "@/lib/keyword-analyzer";
import { TailoredResume } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, resume } = (await req.json()) as {
      jobDescription: string;
      resume: TailoredResume;
    };

    if (!jobDescription || !resume) {
      return NextResponse.json(
        { error: "Job description and resume are required" },
        { status: 400 }
      );
    }

    const analysis = analyzeKeywordMatch(jobDescription, resume);
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to analyze keywords", detail: message },
      { status: 500 }
    );
  }
}
