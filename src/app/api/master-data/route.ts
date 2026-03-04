import { NextRequest, NextResponse } from "next/server";
import { readMasterData, writeMasterData } from "@/lib/master-data";

export async function GET() {
  try {
    const data = await readMasterData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Read master data error:", message, error);
    return NextResponse.json(
      { error: "Failed to read master data", detail: message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    await writeMasterData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Write master data error:", message, error);
    return NextResponse.json(
      { error: "Failed to save master data", detail: message },
      { status: 500 }
    );
  }
}
