// Stand-in for the alters backend during e2e tests. Listens on 127.0.0.1:4599.
//   GET  /public/alters        answers with the current scenario
//   POST /__scenario/<name>    switches the scenario
//   GET  /covers/<name>.png    serves the cover images from e2e/covers/
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { BACKEND_PORT, SCENARIOS, SLOW_MS } from "./fixtures.mjs";

const COVERS = new URL("./covers/", import.meta.url);
let scenario = "with-next";

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname.startsWith("/__scenario/")) {
    const name = url.pathname.slice("/__scenario/".length);
    if (!(name in SCENARIOS)) return send(res, 400, `unknown scenario ${name}`);
    scenario = name;
    return send(res, 200, JSON.stringify({ scenario }));
  }

  if (req.method === "GET" && url.pathname === "/public/alters") {
    if (scenario === "down") return send(res, 503, "unavailable", "text/plain");
    const body = JSON.stringify(SCENARIOS[scenario](new Date()));
    if (scenario === "slow") {
      const timer = setTimeout(() => send(res, 200, body), SLOW_MS);
      res.on("close", () => clearTimeout(timer));
      return;
    }
    return send(res, 200, body);
  }

  const cover = url.pathname.match(/^\/covers\/(open|full)\.png$/);
  if (req.method === "GET" && cover) {
    const png = await readFile(new URL(`${cover[1]}.png`, COVERS));
    return send(res, 200, png, "image/png");
  }

  if (req.method === "GET" && url.pathname === "/__health") {
    return send(res, 200, JSON.stringify({ scenario }));
  }

  send(res, 404, "not found", "text/plain");
});

server.listen(BACKEND_PORT, "127.0.0.1", () => {
  console.log(`fake backend on http://127.0.0.1:${BACKEND_PORT}`);
});
