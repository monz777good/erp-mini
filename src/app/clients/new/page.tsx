"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadBizFile(f: File) {
    const fd = new FormData();
    fd.append("file", f);

    const res = await fetch("/api/clients/bizfile", {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.message || `UPLOAD_FAILED_HTTP_${res.status}`);
    }

    return { bizFileUrl: data.url as string, bizFileName: data.name as string };
  }

  async function onSubmit() {
    if (!name.trim()) {
      alert("거래처명을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      let bizFileUrl: string | null = null;
      let bizFileName: string | null = null;

      // ✅ 파일 있으면 업로드 먼저
      if (file) {
        const up = await uploadBizFile(file);
        bizFileUrl = up.bizFileUrl;
        bizFileName = up.bizFileName;
      }

      // ✅ 거래처 저장 (업로드 URL 포함)
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          owner: owner.trim() || null,
          bizFileUrl,
          bizFileName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.message || `SAVE_FAILED_HTTP_${res.status}`);
        return;
      }

      alert("거래처 등록 완료");
      router.back(); // ✅ 원래 흐름 유지(탭/이전 화면 복귀)
      router.refresh();
    } catch (e: any) {
      alert(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xl font-bold text-white mb-4">거래처 등록</div>

        <div className="space-y-3">
          <div>
            <div className="text-white/80 text-sm mb-1">거래처명</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
              placeholder="거래처명을 입력하세요"
            />
          </div>

          <div>
            <div className="text-white/80 text-sm mb-1">대표자(선택)</div>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10"
              placeholder="대표자명"
            />
          </div>

          <div>
            <div className="text-white/80 text-sm mb-1">사업자등록증 첨부(선택)</div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-white/80"
            />
            {file ? (
              <div className="text-xs text-white/60 mt-1">선택됨: {file.name}</div>
            ) : null}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={onSubmit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-60"
            >
              {loading ? "저장 중..." : "저장"}
            </button>

            <button
              onClick={() => router.back()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/10"
            >
              취소
            </button>
          </div>

          <div className="text-xs text-white/60 pt-2">
            * 저장 버튼을 누르면 파일이 먼저 업로드되고, 거래처에 함께 저장됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}