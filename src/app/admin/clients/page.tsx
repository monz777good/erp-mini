"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  createdAt?: string;
  salesName?: string; // 영업사원명
  name: string;       // 거래처명
  bizNo?: string;     // 사업자번호
  orgNo?: string;     // 요양기관번호
  email?: string;
  address?: string;
  phone?: string;
  note?: string;
};

function normalizeClients(data: any): Client[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clients)) return data.clients;
  return [];
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => {
      const blob = [
        c.salesName, c.name, c.bizNo, c.orgNo, c.email, c.address, c.phone, c.note
      ].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(s);
    });
  }, [clients, q]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/clients", {
        method: "GET",
        credentials: "include", // ✅ 핵심
        cache: "no-store",
      });

      if (res.status === 401) {
        setErr("조회 실패 (401) - 관리자 로그인 상태를 확인하세요.");
        setClients([]);
        return;
      }
      if (!res.ok) {
        setErr(`조회 실패 (${res.status})`);
        setClients([]);
        return;
      }

      const data = await res.json();
      setClients(normalizeClients(data));
    } catch {
      setErr("네트워크 오류");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="erp-title">거래처 / 사업자등록증</h1>
      <p className="erp-subtitle">거래처 정보 및 사업자등록증 업로드 현황을 관리합니다.</p>

      {err ? <div style={{ color: "#b91c1c", fontWeight: 950, marginBottom: 10 }}>{err}</div> : null}

      <div className="erp-row" style={{ marginBottom: 12 }}>
        <input
          className="erp-input"
          placeholder="검색(거래처/요양기관/이메일/비고/영업사원/전화)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="erp-btn" style={{ width: 140, height: 44, background: "#334155" }} onClick={load} disabled={loading}>
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      <div className="erp-table-wrap">
        <table>
          <thead>
            <tr>
              <th>등록일</th>
              <th>영업사원</th>
              <th>거래처명</th>
              <th>사업자번호</th>
              <th>요양기관번호</th>
              <th>이메일</th>
              <th>주소</th>
              <th>전화</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 18, textAlign: "center", color: "#64748b", fontWeight: 900 }}>
                  데이터 없음
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.createdAt ? String(c.createdAt).slice(0, 10) : "-"}</td>
                  <td>{c.salesName ?? "-"}</td>
                  <td style={{ fontWeight: 900 }}>{c.name}</td>
                  <td>{c.bizNo ?? "-"}</td>
                  <td>{c.orgNo ?? "-"}</td>
                  <td>{c.email ?? "-"}</td>
                  <td style={{ minWidth: 260 }}>{c.address ?? "-"}</td>
                  <td>{c.phone ?? "-"}</td>
                  <td style={{ minWidth: 220 }}>{c.note ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "#475569", fontWeight: 800 }}>
        * 모바일에서는 표가 “가로 스크롤”로 보이는 게 정상입니다(글자 세로 찢어짐 방지).
      </div>
    </div>
  );
}