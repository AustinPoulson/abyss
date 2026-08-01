import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { unlinkSync } from "node:fs";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = join(root, "config.json");
const pidPath = join(root, "abyss-controls.pid");
const port = 4173;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  response.end(body);
}

function validConfig(config) {
  const ranges = ["density", "motion", "glow"];
  return config && config.version === 1 && ["ice", "ember", "moss", "violet"].includes(config.palette) && ranges.every((key) => Number.isInteger(config[key]) && config[key] >= 0 && config[key] <= 100);
}

function removePidFile() {
  try { unlinkSync(pidPath); } catch (error) { if (error.code !== "ENOENT") console.error(error.message); }
}

try {
  const previousPid = Number((await readFile(pidPath, "utf8")).trim());
  if (previousPid) {
    try {
      process.kill(previousPid, 0);
      console.error(`Abyss controls is already running (PID ${previousPid}). Run npm run controls:stop first.`);
      process.exit(1);
    } catch (_) { removePidFile(); }
  }
} catch (error) { if (error.code !== "ENOENT") throw error; }

await writeFile(pidPath, String(process.pid), "utf8");
process.on("exit", removePidFile);

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Request body is too large.");
  }
  return body;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    console.log(`${request.method} ${url.pathname}`);
    if (url.pathname === "/api/config") {
      if (request.method === "GET") return send(response, 200, await readFile(configPath, "utf8"), "application/json; charset=utf-8");
      if (request.method === "PUT") {
        const config = JSON.parse(await readBody(request));
        if (!validConfig(config)) return send(response, 400, "Invalid config.");
        await copyFile(configPath, `${configPath}.bak`);
        await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
        return send(response, 200, JSON.stringify(config), "application/json; charset=utf-8");
      }
      return send(response, 405, "Method not allowed.");
    }

    if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, "Method not allowed.");
    const requested = url.pathname === "/" ? join(root, "tools", "control-panel.html") : normalize(join(root, url.pathname));
    if (!requested.startsWith(root)) return send(response, 403, "Forbidden.");
    const body = await readFile(requested);
    response.writeHead(200, { "Content-Type": types[extname(requested)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    send(response, error.code === "ENOENT" ? 404 : 400, error.code === "ENOENT" ? "Not found." : error.message);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("");
  console.log("  abyss local controls");
  console.log(`  panel   http://127.0.0.1:${port}/`);
  console.log(`  artwork http://127.0.0.1:${port}/index.html`);
  console.log("  edit config.json, then refresh the artwork page");
  console.log("  press Ctrl+C to stop");
  console.log("");
});
server.on("error", (error) => {
  removePidFile();
  console.error(`Could not start controls server: ${error.message}`);
  process.exit(1);
});

const terminal = createInterface({ input: process.stdin, output: process.stdout });
terminal.on("SIGINT", () => shutdown());
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGBREAK", shutdown);
process.on("SIGHUP", shutdown);

function shutdown() {
  terminal.close();
  removePidFile();
  server.close(() => {
    console.log("Abyss controls stopped.");
    process.exit(0);
  });
}
