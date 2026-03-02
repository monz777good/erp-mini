"use client";

import AdminTopNav from "@/components/AdminTopNav";
import { useEffect, useMemo, useState } from "react";

type ClientRow = {
  id: string;
  createdAt?: string;
  salesName?: string;
  name?: string;
  bizNo?: string;
  instNo?: string;
  email?: string;
  address?: string;
  phone?: string;
  note?: string;

  // ✅ 사업자등록증
  bizFileUrl?: string | null;
  bizFileName?: string | null;
};

function d10(v?: string) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

export default function AdminClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function load(keyword?: string) {
    setMsg("");
    const kw = (keyword ?? "").trim();
    const qs = kw ? `?q=${encodeURIComponent(kw)}` : "";
    const res = await fetch(`/api/admin/clients${qs}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      setMsg(`조회 실패 (${res.status}) - 관리자 로그인 상태를 확인하세요.`);
      setRows([]);
      return;
    }

    const data = await res.json().catch(() => []);
    setRows(Array.isArray(data) ? data : []);
  }

  async function uploadBizFile(clientId: string, file: File) {
    setMsg("");
    setUploadingId(clientId);
    try {
      const form = new FormData();
      form.append("clientId", clientId);
      form.append("file", file);

      const res = await fetch("/api/admin/clients/bizfile", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.message || `업로드 실패 (${res.status})`);
        return;
      }

      await load(q);
    } finally {
      setUploadingId(null);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  const countText = useMemo(() => `${rows.length}개`, [rows.length]);

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <AdminTopNav />

      <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="m-0 text-xl sm:text-2xl font-black text-black">거래처 / 사업자등록증</h1>
              <div className="mt-2 text-sm font-bold text-gray-700">
                거래처 정보 및 사업자등록증 업로드 현황을 관리합니다. (현재 {countText})
              </div>
            </div>

            <button
              onClick={() => load(q)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-black"
            >
              조회/새로고침
            </button>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
              {msg}
            </div>
          ) : null}

          {/* 검색 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-black text-black mb-2">검색</div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="거래처/사업자번호/주소/전화/비고/파일명 검색"
                className={`${inputCls} flex-1 min-w-[240px]`}
              />
              <button onClick={() => load(q)} className="h-11 rounded-xl bg-black px-4 text-sm font-black text-white">
                조회
              </button>
              <button
                onClick={() => {
                  setQ("");
                  load("");
                }}
                className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-black"
              >
                초기화
              </button>
            </div>
          </div>

          {/* ✅ 모바일: 카드형 / 데스크탑: 표 */}
          <div className="mt-4">
            {/* 모바일 카드 */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center text-sm font-black text-gray-700">
                  데이터 없음
                </div>
              ) : (
                rows.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-black text-black">{r.name ?? "-"}</div>
                      <div className="text-xs font-bold text-gray-700">{d10(r.createdAt)}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Field label="영업사원" value={r.salesName ?? "-"} />
                      <Field label="전화" value={r.phone ?? "-"} />
                      <Field label="사업자번호" value={r.bizNo ?? "-"} />
                      <Field label="요양기관번호" value={r.instNo ?? "-"} />
                      <Field label="이메일" value={r.email ?? "-"} />
                      <Field label="비고" value={r.note ?? "-"} />
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-black text-gray-700">주소</div>
                      <div className="mt-1 text-sm font-bold text-black break-words">{r.address ?? "-"}</div>
                    </div>

                    {/* ✅ 사업자등록증 */}
                    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                      <div className="text-xs font-black text-gray-700">사업자등록증</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {r.bizFileUrl ? (
                          <>
                            <a
                              href={r.bizFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-black underline text-black"
                            >
                              보기
                            </a>
                            <span className="text-xs font-bold text-gray-700">{r.bizFileName ?? ""}</span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-gray-700">없음</span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            uploadBizFile(r.id, f);
                            e.currentTarget.value = "";
                          }}
                        />
                        <button
                          disabled={uploadingId === r.id}
                          className={`h-10 rounded-xl px-3 text-sm font-black text-white ${
                            uploadingId === r.id ? "bg-slate-400" : "bg-black"
                          }`}
                          onClick={() => setMsg("파일 선택하면 자동 업로드됩니다.")}
                        >
                          {uploadingId === r.id ? "업로드 중..." : "업로드"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden sm:block rounded-2xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <Th>등록일</Th>
                    <Th>영업사원</Th>
                    <Th>거래처명</Th>
                    <Th>사업자번호</Th>
                    <Th>요양기관번호</Th>
                    <Th>이메일</Th>
                    <Th>주소</Th>
                    <Th>전화</Th>
                    <Th>비고</Th>
                    <Th>사업자등록증</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="p-5 text-center text-sm font-black text-gray-700" colSpan={10}>
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t border-gray-200">
                        <Td>{d10(r.createdAt)}</Td>
                        <Td>{r.salesName ?? "-"}</Td>
                        <TdStrong>{r.name ?? "-"}</TdStrong>
                        <Td>{r.bizNo ?? "-"}</Td>
                        <Td>{r.instNo ?? "-"}</Td>
                        <Td>{r.email ?? "-"}</Td>
                        <Td>{r.address ?? "-"}</Td>
                        <Td>{r.phone ?? "-"}</Td>
                        <Td>{r.note ?? "-"}</Td>

                        <Td>
                          <div className="flex flex-wrap items-center gap-2">
                            {r.bizFileUrl ? (
                              <>
                                <a
                                  href={r.bizFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-black underline text-black"
                                >
                                  보기
                                </a>
                                <span className="text-xs font-bold text-gray-700">{r.bizFileName ?? ""}</span>
                              </>
                            ) : (
                              <span className="font-black text-gray-700">없음</span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                uploadBizFile(r.id, f);
                                e.currentTarget.value = "";
                              }}
                            />
                            <button
                              disabled={uploadingId === r.id}
                              className={`h-9 rounded-xl px-3 text-xs font-black text-white ${
                                uploadingId === r.id ? "bg-slate-400" : "bg-black"
                              }`}
                              onClick={() => setMsg("파일 선택하면 자동 업로드됩니다.")}
                            >
                              {uploadingId === r.id ? "업로드 중..." : "업로드"}
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs font-bold text-gray-700">
              * 모바일은 카드형, PC는 표로 보입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2">
      <div className="text-[11px] font-black text-gray-700">{label}</div>
      <div className="mt-1 text-sm font-bold text-black break-words">{value}</div>
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm sm:text-base font-bold text-black outline-none focus:ring-2 focus:ring-black/10";

function Th({ children }: { children: any }) {
  return <th className="text-left p-3 text-xs font-black text-black whitespace-nowrap">{children}</th>;
}
function Td({ children }: { children: any }) {
  return <td className="p-3 text-sm font-bold text-black align-top">{children}</td>;
}
function TdStrong({ children }: { children: any }) {
  return <td className="p-3 text-sm font-black text-black align-top">{children}</td>;
}