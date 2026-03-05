"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "SALES" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("SALES");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ 예전 “예 입력칸 자동채움” 방지 + 입력 포맷 기본값
  useEffect(() => {
    setName("");
    setPhone("");
    setPin("");
  }, [role]);

  const canSubmit = useMemo(() => {
    if (!phone.trim() || !pin.trim()) return false;
    if (role === "SALES" && name.trim().length < 1) return false;
    return true;
  }, [role, name, phone, pin]);

  function onlyDigits(v: string) {
    return v.replace(/[^\d]/g, "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setMsg(null);

    try {
      // ✅ 우리 프로젝트에 존재하는 로그인 API들 중 “가장 안정적인” /api/auth/login 사용
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role,
          name: role === "SALES" ? name.trim() : undefined,
          phone: phone.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        const err =
          data?.error ||
          (res.status === 401 ? "PIN이 틀렸습니다." : "로그인에 실패했습니다.");
        setMsg(String(err));
        setLoading(false);
        return;
      }

      // ✅ 관리자면 /admin, 영업사원은 /orders
      router.replace(role === "ADMIN" ? "/admin" : "/orders");
    } catch (e: any) {
      setMsg("서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh w-full overflow-hidden">
      {/* ✅ 고급 배경 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#070A12]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-500/25 blur-[120px]" />
        <div className="absolute top-10 -right-40 h-[560px] w-[560px] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute -bottom-56 left-1/4 h-[620px] w-[620px] rounded-full bg-fuchsia-500/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_10%,rgba(255,255,255,0.08),transparent_55%),radial-gradient(900px_600px_at_80%_20%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(800px_600px_at_60%_90%,rgba(255,255,255,0.05),transparent_55%)]" />
      </div>

      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        {/* ✅ 글래스 카드 */}
        <div className="w-full max-w-[520px]">
          <div className="rounded-3xl border border-white/15 bg-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="px-7 pt-7 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-white/70">
                    ERP MINI
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                    한의N원외탕전
                  </h1>
                  <p className="mt-2 text-sm text-white/70">
                    전화번호 + PIN 로그인
                    <span className="text-white/40">
                      {" "}
                      (영업사원: 최초 로그인 시 이름 필요)
                    </span>
                  </p>
                </div>

                <div className="hidden sm:block rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/70">
                  보안 세션 로그인
                </div>
              </div>

              {/* 탭 */}
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-white/10 p-2">
                <button
                  type="button"
                  onClick={() => setRole("SALES")}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    role === "SALES"
                      ? "bg-white text-black shadow"
                      : "text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  영업사원
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    role === "ADMIN"
                      ? "bg-white text-black shadow"
                      : "text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  관리자
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit} className="px-7 pb-7">
              <div className="space-y-4">
                {/* 이름 (영업사원만) */}
                {role === "SALES" && (
                  <Field
                    label="이름"
                    value={name}
                    onChange={(v) => setName(v)}
                    placeholder="예: 홍길동"
                  />
                )}

                <Field
                  label="전화번호"
                  value={phone}
                  onChange={(v) => setPhone(onlyDigits(v))}
                  placeholder="숫자만 입력 (예: 01012341234)"
                  inputMode="numeric"
                />

                <Field
                  label="PIN"
                  value={pin}
                  onChange={(v) => setPin(onlyDigits(v))}
                  placeholder="숫자만 입력"
                  inputMode="numeric"
                  type="password"
                />

                {msg && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {msg}
                  </div>
                )}

                <button
                  disabled={!canSubmit || loading}
                  className={[
                    "mt-2 w-full rounded-2xl px-5 py-3 text-sm font-bold transition",
                    "border border-white/15",
                    loading || !canSubmit
                      ? "bg-white/20 text-white/60"
                      : "bg-white text-black hover:bg-white/90",
                  ].join(" ")}
                >
                  {loading ? "로그인 중..." : "로그인"}
                </button>

                <div className="pt-2 text-center text-xs text-white/50">
                  {role === "ADMIN"
                    ? "관리자는 로그인 후 /admin 으로 이동합니다."
                    : "영업사원은 로그인 후 /orders 로 이동합니다."}
                </div>
              </div>
            </form>
          </div>

          <div className="mt-6 text-center text-xs text-white/35">
            © {new Date().getFullYear()} ERP MINI
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { label, value, onChange, placeholder, type, inputMode } = props;

  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-white/70">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type ?? "text"}
        inputMode={inputMode}
        className={[
          "w-full rounded-2xl px-4 py-3 text-sm",
          "border border-white/15 bg-white/10 text-white placeholder:text-white/35",
          "outline-none",
          "focus:border-white/30 focus:bg-white/12 focus:ring-2 focus:ring-white/10",
        ].join(" ")}
      />
    </label>
  );
}