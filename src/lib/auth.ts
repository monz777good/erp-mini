import { getSessionUser, requireAdmin, requireUser, saveSessionUser, clearSession } from "@/lib/session";

export {
  getSessionUser,
  requireAdmin,
  requireUser,
  saveSessionUser,
  clearSession,
};

// ✅ 옛 코드 호환: 이름만 남겨둠 (req 무시)
export async function getUserFromRequest() {
  return getSessionUser();
}
export async function getUserIdCookie() {
  const u = await getSessionUser();
  return u?.id ?? null;
}