import express from "express";
import os from "os";
import { execSync } from "child_process";

const app = express();
const startedAt = Date.now();
let reqCount = 0;

app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/metrics", (req, res) => {
  reqCount++;
  const load = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptime = os.uptime();
  const cpus = os.cpus()?.length || 1;

  let disk = {};
  try {
    const out = execSync("df -k --output=target,used,avail,pcent /").toString().trim().split("\n");
    const parts = out[1].trim().split(/\s+/);
    disk = { mount: parts[0], usedKB: Number(parts[1]), availKB: Number(parts[2]), usedPct: parts[3] };
  } catch (e) { disk = { error: e.message }; }

  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus,
    uptimeSeconds: uptime,
    startedAt,
    requestsServed: reqCount,
    cpuLoad: { "1m": +load[0].toFixed(2), "5m": +load[1].toFixed(2), "15m": +load[2].toFixed(2) },
    memory: { total: totalMem, used: usedMem, free: freeMem },
    disk
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Metrics API listening on "+port));
