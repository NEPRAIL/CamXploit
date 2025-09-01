import http from "http";
import https from "https";

export type HttpStatus = "online" | "offline" | "auth_required" | "timeout" | "error";

type Opts = {
  host: string;
  port: number;
  secure?: boolean; // https when true
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT = 5000;

const COMMON_PATHS = [
  "/",
  "/login",
  "/admin",
  "/viewer",
  "/video",
  "/stream",
  "/snapshot",
  "/cgi-bin/",
  "/api/",
  "/axis-cgi/mjpg/video.cgi",
  "/cgi-bin/mjpg/video.cgi",
  "/snapshot.jpg",
];

function headOrGet(url: string, timeout: number): Promise<{ code: number; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.request(url, { method: "HEAD", timeout }, (res) => {
      resolve({ code: res.statusCode || 0, headers: res.headers as any });
      res.resume();
    });
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

export async function checkHTTP(opts: Opts): Promise<{ status: HttpStatus; latencyMs?: number; detail?: string }> {
  const { host, port, secure = false, timeoutMs = DEFAULT_TIMEOUT } = opts;
  const base = `${secure ? "https" : "http"}://${host}:${port}`;
  const start = Date.now();

  try {
    // Probe root first
    const root = await headOrGet(base + "/", timeoutMs);
    const status = mapHttpCodeToStatus(root.code, root.headers);
    const server = (root.headers["server"] || root.headers["Server"]) as string | undefined;
    let found: string[] = [];

    // If online or auth, quickly sample a few common endpoints
    for (const p of COMMON_PATHS) {
      try {
        const r = await headOrGet(base + p, timeoutMs);
        if ([200, 204, 206, 301, 302, 401, 403].includes(r.code)) {
          found.push(`${p}(${r.code})`);
          if (found.length >= 6) break;
        }
      } catch {}
    }

    return {
      status,
      latencyMs: Date.now() - start,
      detail: `server=${server || ""}; endpoints=${found.join(",")}`.slice(0, 500),
    };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("timeout")) {
      return { status: "timeout", latencyMs: Date.now() - start, detail: msg };
    }
    return { status: "error", latencyMs: Date.now() - start, detail: msg };
  }
}

function mapHttpCodeToStatus(code: number, headers: Record<string, any>): HttpStatus {
  if (code === 0) return "offline";
  if (code === 401) return "auth_required";
  if (code >= 200 && code < 400) return "online";
  if (code === 403) return "auth_required";
  return "error";
}
