"use client";

export default function LogoutButton() {
  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // 무시하고 이동 (세션 제거 시도는 했음)
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
    >
      로그아웃
    </button>
  );
}
