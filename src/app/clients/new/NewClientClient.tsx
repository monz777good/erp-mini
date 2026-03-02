"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

export default function NewClientClient() {
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
      const res = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, owner }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.message || "거래처 저장 실패");

      const clientId = data.client?.id;
      if (!clientId) throw new Error("clientId가 없습니다.");

      // ✅ 파일 업로드 (라우트 목록에 있는 경로로 맞춤)
      // 너 로그에: /api/admin/clients/bizfile 이 존재함
      if (file) {
        const form = new FormData();
        form.append("clientId", clientId);
        form.append("file", file);

        const upload = await fetch("/api/admin/clients/bizfile", {
          method: "POST",
          credentials: "include",
          body: form,
        });

        const uploadData = await upload.json().catch(() => null);
        if (!upload.ok || !uploadData?.ok) {
          throw new Error(uploadData?.message || "사업자등록증 업로드 실패");
        }
      }

      alert("등록 완료");
      router.push("/clients");
    } catch (e: any) {
      alert(e?.message || "에러");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <div className="text-2xl font-black">거래처 등록</div>
        <button
          onClick={() => router.push("/clients")}
          className="px-4 py-2 rounded-2xl border border-black/20 font-bold"
        >
          목록
        </button>
      </div>

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
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="text-xs opacity-60 mt-2">
          파일은 선택 안 해도 거래처 등록은 됩니다.
        </div>
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