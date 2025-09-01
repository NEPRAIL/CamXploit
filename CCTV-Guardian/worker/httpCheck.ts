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
  // Enhanced paths for comprehensive scanning
  "/web/",
  "/webpages/",
  "/live",
  "/live.htm",
  "/livestream",
  "/videostream.cgi",
  "/video/mjpg.cgi",
  "/mjpg/video.cgi",
  "/cgi-bin/viewer/video.jpg",
  "/image.jpg",
  "/image/jpeg.cgi",
  "/jpg/image.jpg",
  "/cgi-bin/snapshot.cgi",
  "/axis-cgi/jpg/image.cgi",
  "/onvif/",
  "/device_service",
  "/MediaInput/",
  "/rtsp/",
  "/video1",
  "/channel1",
  "/cam/realmonitor",
  "/videostream.asf",
  "/GetData.cgi",
  "/decoder_control.cgi"
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
    let authEndpoints: string[] = [];

    // If online or auth, comprehensively scan common endpoints
    const pathsToCheck = status === "online" || status === "auth_required" ? COMMON_PATHS : COMMON_PATHS.slice(0, 8);
    
    for (const p of pathsToCheck) {
      try {
        const r = await headOrGet(base + p, Math.min(timeoutMs, 3000)); // Shorter timeout for bulk scanning
        if ([200, 204, 206, 301, 302, 401, 403].includes(r.code)) {
          found.push(`${p}(${r.code})`);
          
          // Track authentication-required endpoints
          if (r.code === 401 || r.code === 403) {
            authEndpoints.push(p);
          }
          
          if (found.length >= 12) break; // Increased limit for comprehensive scanning
        }
      } catch {}
    }

    // Enhanced detail with authentication info
    let detail = `server=${server || "unknown"}; endpoints=${found.join(",")}`;
    if (authEndpoints.length > 0) {
      detail += `; auth_endpoints=${authEndpoints.join(",")}`;
    }

    return {
      status,
      latencyMs: Date.now() - start,
      detail: detail.slice(0, 800), // Increased detail length
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
