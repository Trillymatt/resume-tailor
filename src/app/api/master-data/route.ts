import { NextRequest, NextResponse } from "next/server";
import { readMasterData, writeMasterData } from "@/lib/master-data";

export async function GET() {
  try {
    const data = await readMasterData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Read master data error:", error);
    return NextResponse.json(
      { error: "Failed to read master data" },
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
    console.error("Write master data error:", error);
    return NextResponse.json(
      { error: "Failed to save master data" },
      { status: 500 }
    );
  }
}
