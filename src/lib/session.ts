import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  name: string;
  role: "SALES" | "ADMIN";
};

const COOKIE_NAME = "erp_session";

function encode(data: any) {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decode(str: string) {
  try {
    return JSON.parse(Buffer.from(str, "base64").toString());
  } catch {
    return null;
  }
}

export async function setSessionUser(user: SessionUser) {
  const store = await cookies(); // ✅ 중요: await
  store.set(COOKIE_NAME, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies(); // ✅ 중요: await
  const c = store.get(COOKIE_NAME);
  if (!c) return null;

  const user = decode(c.value);
  if (!user) return null;

  return user as SessionUser;
}

export async function clearSession() {
  const store = await cookies(); // ✅ 중요: await
  store.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "LOGIN_REQUIRED" },
      { status: 401 }
    );
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "ADMIN_ONLY" },
      { status: 403 }
    );
  }
  return user;
}