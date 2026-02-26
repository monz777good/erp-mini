import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

async function requireAdmin(req: Request) {
  const user = await getSessionUser(req as any);
  if (!user) return null;
  if (String(user.role ?? "").toUpperCase() !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      bizNo: true,
      addr: true,
      tel: true,
      careNo: true,
      email: true,
      remark: true,
      bizCertPath: true,
      ownerUser: { select: { name: true, phone: true } },
    },
  });

  return NextResponse.json({ ok: true, clients });
}