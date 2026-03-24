"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ClientForm = {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  careInstitutionNo: string;
  bizRegNo: string;
  email: string;
  receiverName: string;
  receiverAddr: string;
  receiverTel: string;
  receiverMobile: string;
  bizFileUrl?: string | null;
  bizFileName?: string | null;
};

function s(v: any) {
  return String(v ?? "").trim();
}

export default function ClientEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = s(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<ClientForm>({
    id: "",
    name: "",
    address: "",
    ownerName: "",
    careInstitutionNo: "",
    bizRegNo: "",
    email: "",
    receiverName: "",
    receiverAddr: "",
    receiverTel: "",
    receiverMobile: "",
    bizFileUrl: "",
    bizFileName: "",
  });

  async function load() {
    if (!clientId) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/sales/clients/${clientId}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "거래처 정보를 불러오지 못했습니다.");
        return;
      }

      const c = data.client;

      setForm({
        id: c.id ?? "",
        name: c.name ?? "",
        address: c.address ?? "",
        ownerName: c.ownerName ?? "",
        careInstitutionNo: c.careInstitutionNo ?? "",
        bizRegNo: c.bizRegNo ?? "",
        email: c.email ?? "",
        receiverName: c.receiverName ?? "",
        receiverAddr: c.receiverAddr ?? "",
        receiverTel: c.receiverTel ?? "",
        receiverMobile: c.receiverMobile ?? "",
        bizFileUrl: c.bizFileUrl ?? "",
        bizFileName: c.bizFileName ?? "",
      });
    } catch (e: any) {
      setMsg(e?.message || "거래처 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function save() {
    if (!clientId) return;
    if (!s(form.name)) {
      setMsg("거래처명은 필수입니다.");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      const res = await fetch(`/api/sales/clients/${clientId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s(form.name),
          address: s(form.address) || null,
          ownerName: s(form.ownerName) || null,
          careInstitutionNo: s(form.careInstitutionNo) || null,
          bizRegNo: s(form.bizRegNo) || null,
          email: s(form.email) || null,
          receiverName: s(form.receiverName) || null,
          receiverAddr: s(form.receiverAddr) || null,
          receiverTel: s(form.receiverTel) || null,
          receiverMobile: s(form.receiverMobile) || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "수정에 실패했습니다.");
        return;
      }

      setMsg("거래처 정보가 수정되었습니다.");
    } catch (e: any) {
      setMsg(e?.message || "수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const shell = "min-h-screen w-full px-4 py-10 md:py-14";
  const card =
    "mx-auto w-full max-w-[1100px] rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.55)]";
  const inner = "p-6 md:p-8";
  const input =
    "w-full h-[44px] px-4 rounded-2xl border border-white/12 bg-white/5 text-white font-extrabold outline-none placeholder:text-white/35";
  const label = "text-sm font-extrabold text-white/85";
  const btn =
    "h-[44px] px-4 rounded-2xl border border-white/14 bg-white/10 text-white font-extrabold hover:bg-white/15 active:bg-white/20";
  const btnPrimary =
    "h-[44px] px-5 rounded-2xl border border-white/12 bg-emerald-400/90 text-black font-extrabold hover:bg-emerald-300 active:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      className={shell}
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 20%, rgba(120,105,255,0.22), transparent 55%), radial-gradient(900px 600px at 80% 30%, rgba(0,180,255,0.18), transparent 55%), radial-gradient(900px 700px at 50% 90%, rgba(255,255,255,0.08), transparent 55%), linear-gradient(180deg, rgb(8,10,18), rgb(12,14,24))",
      }}
    >
      <div className={card}>
        <div className={inner}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-extrabold text-white">거래처 수정</div>
              <div className="mt-1 text-sm text-white/60">
                본인이 등록한 거래처만 수정할 수 있습니다.
              </div>
            </div>

            <div className="flex gap-2">
              <button className={btn} onClick={() => router.push("/orders")}>
                거래처 목록으로
              </button>
              <button className={btnPrimary} onClick={save} disabled={saving || loading}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white/90">
              {msg}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-white/70 font-bold">불러오는 중...</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="text-white font-extrabold text-lg">거래처 기본정보</div>

                <div className="space-y-2">
                  <div className={label}>거래처명(필수)</div>
                  <input
                    className={input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className={label}>거래처 주소</div>
                  <input
                    className={input}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className={label}>대표자명</div>
                    <input
                      className={input}
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className={label}>요양기관번호</div>
                    <input
                      className={input}
                      value={form.careInstitutionNo}
                      onChange={(e) => setForm({ ...form, careInstitutionNo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className={label}>사업자번호</div>
                    <input
                      className={input}
                      value={form.bizRegNo}
                      onChange={(e) => setForm({ ...form, bizRegNo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className={label}>메일주소</div>
                    <input
                      className={input}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="예: sample@domain.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={label}>사업자등록증</div>
                  {form.bizFileUrl ? (
                    <a
                      href={form.bizFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-[44px] items-center rounded-2xl border border-white/14 bg-white/10 px-4 font-extrabold text-white hover:bg-white/15"
                    >
                      {form.bizFileName || "사업자등록증 보기"}
                    </a>
                  ) : (
                    <div className="text-white/50 text-sm font-bold">등록된 파일 없음</div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-white font-extrabold text-lg">배송 기본값(자동채움용)</div>

                <div className="space-y-2">
                  <div className={label}>수하인</div>
                  <input
                    className={input}
                    value={form.receiverName}
                    onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className={label}>배송지 주소</div>
                  <input
                    className={input}
                    value={form.receiverAddr}
                    onChange={(e) => setForm({ ...form, receiverAddr: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className={label}>전화</div>
                    <input
                      className={input}
                      value={form.receiverTel}
                      onChange={(e) => setForm({ ...form, receiverTel: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className={label}>휴대폰</div>
                    <input
                      className={input}
                      value={form.receiverMobile}
                      onChange={(e) => setForm({ ...form, receiverMobile: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button className={btnPrimary} onClick={save} disabled={saving || loading}>
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}