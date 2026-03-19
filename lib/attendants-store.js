import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { defaultAttendants } from "@/lib/attendants-data";
import { sanitizeAttendants } from "@/lib/attendants-utils";

const ATTENDANTS_FILE_PATH = "data/attendants.json";

function getAttendantsFileAbsolutePath() {
  return path.join(process.cwd(), ATTENDANTS_FILE_PATH);
}

export async function readAttendantsFromRepositoryFile() {
  try {
    const serialized = await readFile(getAttendantsFileAbsolutePath(), "utf8");
    const parsed = JSON.parse(serialized);
    return sanitizeAttendants(parsed?.attendants);
  } catch {
    return defaultAttendants;
  }
}
