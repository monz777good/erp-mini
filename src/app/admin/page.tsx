import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getSessionUser();

  // ✅ 로그인 안했으면 로그인으로
  if (!user) {
    redirect("/login");
  }

  // ✅ 관리자가 아니면 주문페이지로
  if (user.role !== "ADMIN") {
    redirect("/orders");
  }

  return (
    <div style={{ padding: 40, color: "white" }}>
      <h1>관리자 대시보드</h1>
      <p>관리자 전용 화면입니다.</p>
    </div>
  );
}