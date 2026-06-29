import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseReachable = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseReachable = true;
  } catch {
    databaseReachable = false;
  }

  return NextResponse.json({
    status: databaseReachable ? "ok" : "degraded",
    app: "Barangay Digital Service Platform",
    timestamp: new Date().toISOString(),
    databaseReachable,
  });
}
