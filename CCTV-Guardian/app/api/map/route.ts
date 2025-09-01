import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows: any = await db.execute(`
    SELECT c.id, c.name, c.lat, c.lng,
           (SELECT status FROM checks ck WHERE ck.camera_id=c.id ORDER BY created_at DESC LIMIT 1) AS status
    FROM cameras c
    WHERE c.authorized = true AND c.lat IS NOT NULL AND c.lng IS NOT NULL;
  `);
  return NextResponse.json(rows as any);
}
