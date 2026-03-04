import fs from "fs/promises";
import path from "path";
import { MasterData } from "./types";
import masterDataJson from "../../data/master-data.json";

const bundledData: MasterData = masterDataJson as MasterData;

export async function readMasterData(): Promise<MasterData> {
  try {
    const dataPath = path.join(process.cwd(), "data", "master-data.json");
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return bundledData;
  }
}

export async function writeMasterData(data: MasterData): Promise<void> {
  const dataPath = path.join(process.cwd(), "data", "master-data.json");
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
}
