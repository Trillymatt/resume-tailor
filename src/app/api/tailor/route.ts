import { NextRequest, NextResponse } from "next/server";
import { readMasterData } from "@/lib/master-data";
import { tailorWithClaude } from "@/lib/claude";

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
    const tailored = await tailorWithClaude(jobDescription, masterData);

    return NextResponse.json({ original: masterData, tailored });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Tailor error:", message, error);
    return NextResponse.json(
      { error: "Failed to generate tailored resume", detail: message },
      { status: 500 }
    );
  }
}
