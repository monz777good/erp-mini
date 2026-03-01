"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type RoleChoice = "SALES" | "ADMIN";

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<RoleChoice>("SALES");
  const [autoLogin, setAutoLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 1 &&
      digitsOnly(phone).length >= 8 &&
      pin.trim().length >= 4
    );
  }, [name, phone, pin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: digitsOnly(phone),
          pin: pin.trim(),
          role,
          autoLogin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMsg(data?.message || "로그인 실패");
        setLoading(false);
        return;
      }

      router.push(role === "ADMIN" ? "/admin" : "/orders");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="login-bg">
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-head">
              <h1 className="login-title">한의N원외탕전 ERP 로그인</h1>
              <p className="login-sub">
                이름 / 전화번호 / PIN 입력 후 로그인
              </p>
            </div>

            <form onSubmit={onSubmit} className="login-form">
              <div className="field">
                <label className="label">이름</label>
                <input
                  className="input"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label className="label">전화번호</label>
                <input
                  className="input"
                  placeholder="01012341234"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="field">
                <label className="label">PIN</label>
                <input
                  className="input"
                  placeholder="예: 1111"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>

              <div className="roleBox">
                <div className="roleRow">
                  <label className="chk">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "SALES"}
                      onChange={() => setRole("SALES")}
                    />
                    <span>영업사원</span>
                  </label>

                  <label className="chk">
                    <input
                      type="radio"
                      name="role"
                      checked={role === "ADMIN"}
                      onChange={() => setRole("ADMIN")}
                    />
                    <span>관리자</span>
                  </label>
                </div>

                <div className="roleRow">
                  <label className="chk">
                    <input
                      type="checkbox"
                      checked={autoLogin}
                      onChange={(e) => setAutoLogin(e.target.checked)}
                    />
                    <span>자동로그인</span>
                  </label>
                </div>
              </div>

              {msg ? <div className="msg">{msg}</div> : null}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="btn"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="login-foot">
              <span className="foot-dot" />
              <span>한의N원외탕전</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Tailwind 상관없이 “무조건” 고급스럽게 보이게 하는 CSS */}
      <style jsx global>{`
        .login-bg {
          min-height: 100vh;
          background: radial-gradient(
              1200px 600px at 10% 10%,
              rgba(99, 102, 241, 0.35),
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(
              900px 500px at 90% 20%,
              rgba(16, 185, 129, 0.25),
              rgba(0, 0, 0, 0)
            ),
            linear-gradient(135deg, #0b1220, #081b1d);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
        }
        .login-wrap {
          width: 100%;
          max-width: 560px;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 26px;
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.35);
          padding: 26px 22px 18px;
          backdrop-filter: blur(14px);
        }
        .login-head {
          margin-bottom: 18px;
        }
        .login-title {
          margin: 0;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -0.6px;
          font-weight: 900;
          color: #0f172a;
        }
        .login-sub {
          margin: 10px 0 0;
          font-size: 14px;
          color: #475569;
          font-weight: 700;
        }

        .login-form {
          display: grid;
          gap: 14px;
        }
        .field {
          display: grid;
          gap: 8px;
        }
        .label {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }
        .input {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.14);
          padding: 14px 14px;
          font-size: 16px;
          outline: none;
          background: rgba(255, 255, 255, 0.95);
          transition: all 0.15s ease;
        }
        .input:focus {
          border-color: rgba(15, 23, 42, 0.32);
          box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08);
        }

        .roleBox {
          margin-top: 6px;
          padding: 12px 12px;
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          gap: 10px;
        }
        .roleRow {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .chk {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          font-weight: 900;
          color: #0f172a;
          font-size: 16px;
          white-space: nowrap;
          user-select: none;
        }
        .chk input {
          width: 18px;
          height: 18px;
        }

        .msg {
          border-radius: 16px;
          border: 1px solid rgba(239, 68, 68, 0.18);
          background: rgba(239, 68, 68, 0.07);
          color: #b91c1c;
          padding: 10px 12px;
          font-weight: 800;
          font-size: 13px;
        }

        .btn {
          width: 100%;
          border: none;
          border-radius: 18px;
          padding: 16px 14px;
          font-size: 18px;
          font-weight: 900;
          color: white;
          background: linear-gradient(135deg, #0f172a, #111827);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.35);
          cursor: pointer;
          transition: transform 0.08s ease, opacity 0.12s ease;
        }
        .btn:active {
          transform: translateY(1px);
        }
        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .login-foot {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(15, 23, 42, 0.55);
          font-weight: 900;
          font-size: 12px;
        }
        .foot-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.35);
          display: inline-block;
        }

        /* ✅ 모바일에서 더 예쁘게 */
        @media (max-width: 420px) {
          .login-card {
            padding: 22px 16px 16px;
            border-radius: 22px;
          }
          .login-title {
            font-size: 26px;
          }
          .label {
            font-size: 15px;
          }
          .btn {
            font-size: 17px;
          }
        }
      `}</style>
    </>
  );
}