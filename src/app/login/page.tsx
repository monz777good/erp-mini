"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("SALES");

  // ✅ 기본은 자동로그인 OFF (빈칸 + placeholder만 보이게)
  const [autoLogin, setAutoLogin] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 저장된 값이 있어도 "autoLogin=true"로 저장된 경우에만 자동 채움
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_login_saved");
      if (!saved) return;

      const obj = JSON.parse(saved);
      if (obj?.autoLogin !== true) return;

      if (obj?.name) setName(obj.name);
      if (obj?.phone) setPhone(obj.phone);
      if (obj?.pin) setPin(obj.pin);
      if (obj?.role === "ADMIN" || obj?.role === "SALES") setRole(obj.role);

      setAutoLogin(true);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanName = name.trim();
    const cleanPhone = String(phone).replace(/\D/g, "");
    const cleanPin = String(pin).replace(/\D/g, "");

    if (!cleanName || !cleanPhone || !cleanPin) {
      alert("이름/전화번호/PIN을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "ADMIN" ? "/api/login" : "/api/sales-login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          pin: cleanPin,
        }),
      });

      if (!res.ok) {
        alert("로그인 실패 (이름/전화/PIN 확인)");
        return;
      }

      // ✅ 체크한 사람만 저장/복원
      if (autoLogin) {
        localStorage.setItem(
          "erp_login_saved",
          JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
            pin: cleanPin,
            role,
            autoLogin: true,
          })
        );
      } else {
        localStorage.removeItem("erp_login_saved");
      }

      router.replace(role === "ADMIN" ? "/admin/dashboard" : "/orders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* 배경 오버레이 */}
      <div style={styles.overlay} />

      {/* 가운데 카드 */}
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.title}>한의N원외탕전 ERP 로그인</div>
            <div style={styles.sub}>이름 / 전화번호 / PIN 입력 후 로그인</div>
          </div>

          <form onSubmit={onSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>이름</label>
              <input
                style={styles.input}
                placeholder="예: 홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>전화번호</label>
              <input
                style={styles.input}
                placeholder="숫자만 입력"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>PIN</label>
              <input
                style={styles.input}
                placeholder="예: 1111"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </div>

            <div style={styles.rowBetween}>
              <div style={styles.roleWrap}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "SALES"}
                    onChange={() => setRole("SALES")}
                  />
                  <span style={styles.radioText}>영업사원</span>
                </label>

                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "ADMIN"}
                    onChange={() => setRole("ADMIN")}
                  />
                  <span style={styles.radioText}>관리자</span>
                </label>
              </div>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                />
                <span style={styles.checkText}>자동로그인</span>
              </label>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div style={styles.footer}>© 한의N원외탕전</div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundImage: "url('/bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.45) 100%)",
  },
  wrap: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: 24,
    boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    overflow: "hidden",
  },
  header: {
    padding: "26px 26px 12px",
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#111",
  },
  sub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(0,0,0,0.55)",
  },
  form: {
    padding: "10px 26px 22px",
    display: "grid",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 900,
    color: "rgba(0,0,0,0.78)",
  },
  input: {
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    outline: "none",
    fontSize: 16,
    background: "rgba(255,255,255,0.95)",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 2,
  },
  roleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    color: "rgba(0,0,0,0.78)",
  },
  radioText: {
    fontSize: 14,
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    color: "rgba(0,0,0,0.78)",
  },
  checkText: {
    fontSize: 14,
  },
  button: {
    height: 48,
    borderRadius: 16,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.2,
    marginTop: 6,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(0,0,0,0.55)",
    paddingTop: 6,
  },
};