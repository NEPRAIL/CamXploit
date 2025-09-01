import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { cameras } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  ip: z.string().min(3),
  port: z.number().int().min(1).max(65535).default(554),
  protocol: z.enum(["rtsp","http"]),
  lat: z.number().optional(),
  lng: z.number().optional(),
  authorized: z.boolean().default(false),
  consentProof: z.string().optional(),
  usernameRef: z.string().optional(),
  passwordRef: z.string().optional(),
});

export async function POST(req: Request) {
  const data = schema.parse(await req.json());
  if (data.authorized && !data.consentProof) {
    return NextResponse.json({ error: "consentProof required to set authorized=true" }, { status: 400 });
  }
  if (data.id) {
    await db.update(cameras).set({
      name: data.name, ip: data.ip, port: data.port, protocol: data.protocol,
      lat: data.lat, lng: data.lng, authorized: data.authorized,
      consentProof: data.consentProof, usernameRef: data.usernameRef, passwordRef: data.passwordRef,
    }).where(eq(cameras.id, data.id));
    return NextResponse.json({ ok: true, id: data.id });
  }
  const inserted = await db.insert(cameras).values({
    name: data.name, ip: data.ip, port: data.port, protocol: data.protocol,
    lat: data.lat, lng: data.lng, authorized: data.authorized,
    consentProof: data.consentProof, usernameRef: data.usernameRef, passwordRef: data.passwordRef,
  }).returning({ id: cameras.id });
  return NextResponse.json({ ok: true, id: inserted[0].id });
}
