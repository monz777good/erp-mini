"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Row = {
  id: string;
  createdAt?: string;
  name?: string | null;
  code?: string | null;      // 거래처코드
  email?: string | null;     // Email
  zip?: string | null;       // 주소1 우편번호
  address?: string | null;   // 주소1
  phone?: string | null;     // 전화
  mobile?: string | null;    // 모바일
  ownerName?: string | null; // 대표자명
  note?: string | null;      // 검색창내용
};

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export default function AdminEcountClientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadExcel() {
    try {
      setLoading(true);
      setMsg("");

      const res = await fetch("/ecount_clients.xlsx", {
        cache: "no-store",
      });

      if (!res.ok) {
        setMsg("엑셀 파일을 불러오지 못했습니다.");
        setRows([]);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // 1행 제목 제외, 2행부터 헤더
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        range: 1,
        defval: "",
      });

      const parsed: Row[] = rawRows
        .map((row, idx) => {
          const name = pick(row, ["거래처명"]);
          const code = pick(row, ["거래처코드"]);
          const email = pick(row, ["Email", "이메일"]);
          const zip = pick(row, ["주소1 우편번호", "우편번호"]);
          const address = pick(row, ["주소1"]);
          const ownerName = pick(row, ["대표자명"]);
          const phone = pick(row, ["전화"]);
          const mobile = pick(row, ["모바일"]);
          const note = pick(row, ["검색창내용"]);

          return {
            id: `excel-${idx + 1}`,
            createdAt: "",
            name,
            code: code || null,
            email: email || null,
            zip: zip || null,
            address: address || null,
            phone: phone || null,
            mobile: mobile || null,
            ownerName: ownerName || null,
            note: note || null,
          };
        })
        .filter((row) => row.name);

      setRows(parsed);
    } catch (e: any) {
      setMsg(e?.message || "엑셀을 읽는 중 오류가 발생했습니다.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExcel();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const name = row.name || "";
      const code = row.code || "";
      const ownerName = row.ownerName || "";
      const phone = row.phone || "";
      const mobile = row.mobile || "";
      const address = row.address || "";

      return (
        name.toLowerCase().includes(keyword) ||
        code.toLowerCase().includes(keyword) ||
        ownerName.toLowerCase().includes(keyword) ||
        phone.toLowerCase().includes(keyword) ||
        mobile.toLowerCase().includes(keyword) ||
        address.toLowerCase().includes(keyword)
      );
    });
  }, [rows, q]);

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 10px",
    fontWeight: 900,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
    fontSize: 14,
  };

  const td: React.CSSProperties = {
    padding: "12px 10px",
    fontWeight: 800,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    fontSize: 14,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    fontWeight: 800,
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div className="erp-shell">
      <div className="erp-card">
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>
          이카운트 거래처
        </h1>

        <div style={{ fontWeight: 700, opacity: 0.8, marginBottom: 14 }}>
          관리자 전용 이카운트 거래처 목록 (기존 영업사원 거래처와 완전 분리)
        </div>

        {msg ? (
          <div style={{ color: "#ff6b6b", fontWeight: 900, marginBottom: 10 }}>
            {msg}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="거래처명 / 거래처코드 / 대표자 / 전화 검색"
              style={inputStyle}
            />
          </div>

          <button style={btnStyle} onClick={() => setQ(q)}>
            검색
          </button>

          <button
            style={btnStyle}
            onClick={() => {
              setQ("");
            }}
          >
            전체보기
          </button>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1500,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 260 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 360 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 120 }} />
            </colgroup>

            <thead>
              <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                <th style={th}>등록일</th>
                <th style={th}>거래처명</th>
                <th style={th}>거래처코드</th>
                <th style={th}>이메일</th>
                <th style={th}>우편번호</th>
                <th style={th}>주소</th>
                <th style={th}>전화</th>
                <th style={th}>핸드폰</th>
                <th style={th}>대표자</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: 18, textAlign: "center", fontWeight: 900, opacity: 0.8 }}
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ padding: 18, textAlign: "center", fontWeight: 900, opacity: 0.8 }}
                  >
                    데이터 없음
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAt ? String(r.createdAt).slice(0, 10) : "-"}</td>
                    <td style={{ ...td, whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.35 }}>
                      {r.name ?? "-"}
                    </td>
                    <td style={td}>{r.code ?? "-"}</td>
                    <td style={{ ...td, whiteSpace: "normal", wordBreak: "break-all", lineHeight: 1.35 }}>
                      {r.email ?? "-"}
                    </td>
                    <td style={td}>{r.zip ?? "-"}</td>
                    <td style={{ ...td, whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.35 }}>
                      {r.address ?? "-"}
                    </td>
                    <td style={td}>{r.phone ?? "-"}</td>
                    <td style={td}>{r.mobile ?? "-"}</td>
                    <td style={td}>{r.ownerName ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}