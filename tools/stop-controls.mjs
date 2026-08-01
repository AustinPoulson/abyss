import { readFile, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pidPath = join(root, "abyss-controls.pid");

try {
  const pid = Number((await readFile(pidPath, "utf8")).trim());
  if (!pid) throw new Error("Invalid PID file.");
  process.kill(pid);
  await unlink(pidPath);
  console.log(`Stopped abyss controls (PID ${pid}).`);
} catch (error) {
  if (error.code === "ENOENT") console.log("No tracked abyss controls process found.");
  else if (error.code === "ESRCH") { await unlink(pidPath).catch(() => {}); console.log("Removed stale abyss controls PID file."); }
  else throw error;
}
