import "dotenv/config";
import { db } from "../lib/db";
import { checks } from "../db/schema";
import { checkRTSP } from "./rtspCheck";
import { checkHTTP } from "./httpCheck";

const ENFORCE = process.env.ALLOWLIST_ENFORCED !== "false";

async function getSecret(_: string | null | undefined) {
  // TODO: integrate your secret manager; return { username, password } | undefined
  return undefined;
}

async function main() {
  // Authorized cameras only
  const rows: any = await db.execute(`
    SELECT id, name, ip, port, protocol, username_ref AS "usernameRef", password_ref AS "passwordRef",
           authorized, consent_proof AS "consentProof"
    FROM cameras WHERE authorized = true;
  `);
  for (const cam of (rows as any[])) {
    if (ENFORCE && (!cam.authorized || !cam.consentProof)) continue;
    const creds = await getSecret(cam.usernameRef);
    let res: { status: string; latencyMs?: number; detail?: string };
    if (cam.protocol === "rtsp") {
      res = await checkRTSP({ host: cam.ip, port: cam.port, username: (creds as any)?.username, password: (creds as any)?.password, timeoutMs: 5000 });
    } else {
      const secure = cam.port === 443 || cam.port === 8443 || cam.port === 9443;
      res = await checkHTTP({ host: cam.ip, port: cam.port, secure, timeoutMs: 5000 });
    }
    await db.insert(checks).values({ cameraId: cam.id, status: res.status, latencyMs: res.latencyMs, detail: res.detail?.slice(0,500) });
  }
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
