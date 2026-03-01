"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialRole = (sp.get("role")?.toUpperCase() as Role) || "SALES";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const r = (sp.get("role")?.toUpperCase() as Role) || "SALES";
    setRole(r);
  }, [sp]);

  function digitsOnly(v: string) {
    return v.replace(/\D/g, "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: digitsOnly(phone),
          pin: pin.trim(),
          role,
          remember,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error || "로그인 실패");
        return;
      }

      router.replace(role === "ADMIN" ? "/admin/orders" : "/orders");
    } catch (err: any) {
      setMsg(err?.message || "로그인 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="erp-overlay">
      <div className="erp-shell">
        <div className="erp-shell-inner" style={{ maxWidth: 820 }}>
          <div className="erp-card">
            <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>
              한의N원외탕전 ERP 로그인
            </h1>
            <div style={{ color: "#444", marginBottom: 18, fontWeight: 700 }}>
              이름 / 전화번호 / PIN 입력 후 로그인
            </div>

            <form onSubmit={onSubmit}>
              <label style={{ display: "block", fontWeight: 800, marginTop: 10 }}>
                이름
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동"
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />

              <label style={{ display: "block", fontWeight: 800, marginTop: 14 }}>
                전화번호
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="숫자만 입력"
                inputMode="numeric"
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />

              <label style={{ display: "block", fontWeight: 800, marginTop: 14 }}>
                PIN
              </label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="예: 1111"
                inputMode="numeric"
                style={{
                  width: "100%",
                  height: 46,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(0,0,0,0.03)",
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                  <input
                    type="radio"
                    checked={role === "SALES"}
                    onChange={() => setRole("SALES")}
                  />
                  영업사원
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                  <input
                    type="radio"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />
                  관리자
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  자동로그인
                </label>
              </div>

              {msg ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(255,0,0,0.06)",
                    border: "1px solid rgba(255,0,0,0.15)",
                    color: "#a10000",
                    fontWeight: 800,
                  }}
                >
                  {msg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 54,
                  borderRadius: 16,
                  border: 0,
                  marginTop: 18,
                  fontWeight: 900,
                  fontSize: 16,
                  background: "#111",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              <div style={{ marginTop: 14, color: "#666", textAlign: "center", fontWeight: 700 }}>
                © 한의N원외탕전
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}