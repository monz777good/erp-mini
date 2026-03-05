import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIronSession, IronSessionData } from "iron-session";
import { prisma } from "@/lib/prisma";

type Role = "SALES" | "ADMIN";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: string;
      name: string;
      phone: string;
      role: Role;
    };
  }
}

const sessionOptions = {
  cookieName: "erp_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

function assertEnv() {
  if (!process.env.SESSION_PASSWORD) {
    throw new Error("SESSION_PASSWORD is missing in environment variables.");
  }
}

// ✅ Next 16 cookies() 타입 이슈 회피: iron-session에 CookieStore로 캐스팅
export async function getSession() {
  assertEnv();

  // iron-session이 기대하는 CookieStore 타입과 Next cookies() 타입이 다르게 잡혀서 빌드가 터짐
  // 런타임은 정상이라, 여기서만 안전하게 캐스팅해서 통과시킨다.
  const cookieStore = cookies() as any;

  return getIronSession<IronSessionData>(cookieStore, sessionOptions);
}

export async function getSessionUser() {
  const session = await getSession();
  return session.user ?? null;
}

export async function setSessionUser(user: {
  id: string;
  name: string;
  phone: string;
  role: Role;
}) {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}

export async function requireUser() {
  const session = await getSession();

  if (!session.user) {
    return NextResponse.json(
      { ok: false, error: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, phone: true, role: true },
  });

  if (!dbUser) {
    session.destroy();
    return NextResponse.json(
      { ok: false, error: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }

  return dbUser;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u instanceof NextResponse) return u;

  if (u.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 403 }
    );
  }
  return u;
}

export const requireAdminUser = requireAdmin;