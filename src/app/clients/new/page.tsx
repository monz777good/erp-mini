"use client";

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
      const res = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, owner }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message);

      const clientId = data.client.id;

      // 파일 업로드
      if (file) {
        const form = new FormData();
        form.append("clientId", clientId);
        form.append("file", file);

        const upload = await fetch("/api/admin/clients/upload", {
          method: "POST",
          body: form,
        });

        const uploadData = await upload.json();
        if (!uploadData.ok) throw new Error(uploadData.message);
      }

      alert("등록 완료");
      router.push("/clients");

    } catch (e: any) {
      alert(e.message);
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
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold"
        >
          {loading ? "저장중..." : "등록"}
        </button>
      </div>
    </AppShell>
  );
}