import fs from "fs/promises";
import path from "path";
import { MasterData } from "./types";

function getDataPath() {
  return path.join(process.cwd(), "data", "master-data.json");
}

export async function readMasterData(): Promise<MasterData> {
  const dataPath = getDataPath();
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read master data from ${dataPath}`, err);
    console.error(`process.cwd() = ${process.cwd()}`);
    try {
      const dirContents = await fs.readdir(process.cwd());
      console.error("Root dir contents:", dirContents);
      const dataDir = path.join(process.cwd(), "data");
      const dataDirContents = await fs.readdir(dataDir).catch(() => "data/ dir not found");
      console.error("data/ dir contents:", dataDirContents);
    } catch { /* ignore diagnostic errors */ }
    throw err;
  }
}

export async function writeMasterData(data: MasterData): Promise<void> {
  await fs.writeFile(getDataPath(), JSON.stringify(data, null, 2), "utf-8");
}
