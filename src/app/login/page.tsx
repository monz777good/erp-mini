"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "SALES" | "ADMIN";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialRole = useMemo<Role>(() => {
    const r = (sp.get("role") ?? "").toUpperCase();
    return r === "ADMIN" ? "ADMIN" : "SALES";
  }, [sp]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [autoLogin, setAutoLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  async function tryLogin(endpoint: string) {
    const payload = {
      name: name.trim(),
      phone: digitsOnly(phone),
      pin: String(pin ?? "").trim(),
      role,
      autoLogin,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const msg = json?.message ?? "LOGIN_FAILED";
      throw new Error(msg);
    }
  }

  async function onSubmit() {
    setLoading(true);
    setErr("");
    setOk("");

    try {
      if (!name.trim()) throw new Error("이름을 입력하세요.");
      const ph = digitsOnly(phone);
      if (!ph) throw new Error("전화번호를 입력하세요. (숫자만)");
      if (!pin.trim()) throw new Error("PIN을 입력하세요.");

      // 1) /api/login 우선, 없으면 /api/auth/login
      try {
        await tryLogin("/api/login");
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        if (msg.includes("404") || msg.includes("Not Found")) {
          await tryLogin("/api/auth/login");
        } else {
          // /api/login이 살아있는데 실패한 경우
          throw e;
        }
      }

      setOk("로그인 성공");
      if (role === "ADMIN") router.replace("/admin/orders");
      else router.replace("/orders");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-bg">
      <div className="page-wrap">
        <div className="glass-card">
          <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 6 }}>
            한의N원외탕전 ERP 로그인
          </div>
          <div style={{ color: "rgba(0,0,0,.6)", fontWeight: 800, marginBottom: 18 }}>
            이름 / 전화번호 / PIN 입력 후 로그인
          </div>

          {err ? <div className="msg err">{err}</div> : null}
          {ok ? <div className="msg ok">{ok}</div> : null}

          <div className="form-grid">
            <div style={{ fontWeight: 900 }}>이름</div>
            <input className="input" placeholder="예: 홍길동" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-grid">
            <div style={{ fontWeight: 900 }}>전화번호</div>
            <input
              className="input"
              placeholder="숫자만 입력"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="form-grid">
            <div style={{ fontWeight: 900 }}>PIN</div>
            <input
              className="input"
              placeholder="예: 1111"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              type="password"
            />
          </div>

          <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "rgba(0,0,0,.04)" }}>
            <label style={{ marginRight: 14, fontWeight: 900 }}>
              <input
                type="radio"
                name="role"
                checked={role === "SALES"}
                onChange={() => setRole("SALES")}
                style={{ marginRight: 6 }}
              />
              영업사원
            </label>
            <label style={{ fontWeight: 900 }}>
              <input
                type="radio"
                name="role"
                checked={role === "ADMIN"}
                onChange={() => setRole("ADMIN")}
                style={{ marginRight: 6 }}
              />
              관리자
            </label>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontWeight: 900 }}>
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                자동로그인
              </label>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button className="btn dark" style={{ width: "100%" }} disabled={loading} onClick={onSubmit}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div style={{ marginTop: 10, textAlign: "center", color: "rgba(0,0,0,.55)", fontWeight: 800 }}>
            © 한의N원외탕전
          </div>
        </div>
      </div>
    </div>
  );
}