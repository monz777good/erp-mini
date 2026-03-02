"use client";

// ✅ Vercel에서 /clients/new 를 "서버(람다, ƒ)"로 강제해서 lambda 못찾는 오류 방지
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveClient() {
    if (!name || !owner) {
      alert("거래처명 / 대표자명 입력");
      return;
    }

    setLoading(true);

    try {
      // ✅ 거래처 생성
      const res = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, owner }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `거래처 등록 실패 (${res.status})`);
      }

      const clientId = data.client?.id;
      if (!clientId) throw new Error("clientId가 없습니다 (API 응답 확인 필요)");

      // ✅ 파일 업로드(선택)
      if (file) {
        const form = new FormData();
        form.append("clientId", clientId);
        form.append("file", file);

        // ⚠️ 너가 지금 쓰는 업로드 API 경로 그대로 유지
        const upload = await fetch("/api/admin/clients/upload", {
          method: "POST",
          body: form,
        });

        const uploadData = await upload.json().catch(() => ({} as any));
        if (!upload.ok || !uploadData?.ok) {
          throw new Error(uploadData?.message || `파일 업로드 실패 (${upload.status})`);
        }
      }

      alert("등록 완료");
      router.push("/clients");
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="text-2xl font-black">거래처 등록</div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          className="input"
          placeholder="거래처명"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input"
          placeholder="대표자명"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        />
      </div>

      <div className="mt-6">
        <div className="font-bold mb-2">사업자등록증 업로드</div>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveClient}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold disabled:opacity-50"
        >
          {loading ? "저장중..." : "등록"}
        </button>
      </div>
    </AppShell>
  );
}