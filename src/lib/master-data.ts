import fs from "fs/promises";
import path from "path";
import { MasterData } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "master-data.json");

export async function readMasterData(): Promise<MasterData> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeMasterData(data: MasterData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}
