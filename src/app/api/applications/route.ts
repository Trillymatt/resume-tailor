import { NextRequest, NextResponse } from "next/server";
import {
  readTrackedApplications,
  writeTrackedApplications,
} from "@/lib/tracked-applications";
import { TrackedApplication } from "@/lib/types";

export async function GET() {
  try {
    const apps = await readTrackedApplications();
    return NextResponse.json(apps);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to read applications", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const app: TrackedApplication = await req.json();
    const apps = await readTrackedApplications();
    apps.push(app);
    await writeTrackedApplications(apps);
    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save application", detail: message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updated: TrackedApplication = await req.json();
    const apps = await readTrackedApplications();
    const index = apps.findIndex((a) => a.id === updated.id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    apps[index] = updated;
    await writeTrackedApplications(apps);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update application", detail: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const apps = await readTrackedApplications();
    const filtered = apps.filter((a) => a.id !== id);
    if (filtered.length === apps.length) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    await writeTrackedApplications(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to delete application", detail: message },
      { status: 500 }
    );
  }
}
