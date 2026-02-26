// src/lib/auth.ts
import { getSessionUser } from "@/lib/session";

export { getSessionUser }; // ✅ 어떤 파일이 '@/lib/auth'에서 getSessionUser를 import해도 OK

export async function requireUser(req?: Request) {
  const user = await getSessionUser(req);
  return user ?? null;
}

export async function requireAdmin(req?: Request) {
  const user = await getSessionUser(req);
  if (!user) return null;
  if (String(user.role ?? "").toUpperCase() !== "ADMIN") return null;
  return user;
}