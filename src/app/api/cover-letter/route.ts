import { NextRequest, NextResponse } from "next/server";
import { readMasterData } from "@/lib/master-data";
import { generateCoverLetter } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { jobDescription } = await req.json();

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const masterData = await readMasterData();
    const coverLetter = await generateCoverLetter(jobDescription, masterData);

    return NextResponse.json({ coverLetter });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Cover letter error:", message, error);
    return NextResponse.json(
      { error: "Failed to generate cover letter", detail: message },
      { status: 500 }
    );
  }
}
