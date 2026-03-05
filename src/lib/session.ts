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

/**
 * ✅ Next 버전에 따라 cookies()가 Promise처럼 동작하는 경우가 있어
 *    (프로덕션/빌드 환경에서 특히) -> get() 없어서 런타임 500 발생
 * ✅ 그래서 "Promise면 await" 처리해서 무조건 get() 있는 cookieStore로 만든다.
 */
async function getCookieStore(): Promise<any> {
  let store: any = (cookies as any)(); // 혹시 비동기면 Promise가 들어옴

  if (store && typeof store.then === "function") {
    store = await store;
  }

  if (!store || typeof store.get !== "function") {
    // 여기 걸리면 정확히 지금 네 에러("e.get is not a function") 상황
    throw new Error("CookieStore is invalid: missing get()");
  }

  return store;
}

export async function getSession() {
  assertEnv();
  const cookieStore = await getCookieStore();
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

// ✅ 기존 이름 호환
export const requireAdminUser = requireAdmin;