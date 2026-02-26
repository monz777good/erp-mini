import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

function isAdmin(role: any) {
  return String(role ?? "").toUpperCase() === "ADMIN";
}

async function requireAdmin() {
  const user = await getSessionUser(); // ✅ 인자 없음
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "권한 없음" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    user: admin,
  });
}