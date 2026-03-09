import fs from "fs/promises";
import path from "path";
import { TrackedApplication } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "tracked-applications.json");

export async function readTrackedApplications(): Promise<TrackedApplication[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeTrackedApplications(
  apps: TrackedApplication[]
): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(apps, null, 2), "utf-8");
}
