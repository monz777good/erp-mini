"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type Item = { id: string; name: string };
type Client = { id: string; name: string };
type Me = { id: string; name: string; phone: string; role: "SALES" | "ADMIN" };

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function OrdersClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") ?? "order";

  const [me, setMe] = useState<Me | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [clientQ, setClientQ] = useState("");
  const [itemQ, setItemQ] = useState("");
  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");

  // 조회(히스토리)
  const [history, setHistory] = useState<any[]>([]);
  const [historyQ, setHistoryQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // ---------- 공통 스타일 ----------
  const sectionTitle = "text-2xl font-black tracking-tight text-white";
  const subTitle = "mt-2 text-sm font-bold text-white/60";

  const card = "rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl";
  const cardInner = "p-6 md:p-8";
  const label = "mb-2 text-sm font-black text-white/85";
  const input =
    "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20";
  const select =
    "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-white/20";
  const btn =
    "rounded-2xl bg-white px-5 py-3 font-black text-black shadow-md hover:opacity-95 active:opacity-90 disabled:opacity-50";
  const btnGhost =
    "rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-black text-white hover:bg-white/10 active:bg-white/15";

  // ---------- 탭 이동 ----------
  function goTab(next: string) {
    router.replace(`/orders?tab=${next}`);
  }

  // ---------- 로그아웃 ----------
  async function logout() {
    setErr(null);
    try {
      // 우선 /api/auth/logout (너 라우트 목록에 있음)
      let r = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });

      // 혹시 GET만 되는 구현이면 한번 더
      if (!r.ok) r = await fetch("/api/auth/logout", { method: "GET", credentials: "include" });

      // fallback: /api/logout 도 있음
      if (!r.ok) {
        r = await fetch("/api/logout", { method: "POST", credentials: "include" });
        if (!r.ok) r = await fetch("/api/logout", { method: "GET", credentials: "include" });
      }
    } catch {}
    router.replace("/login");
  }

  // ---------- 로그인 세션 확인 ----------
  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const json = await res.json().catch(() => ({}));
        // 형태: { ok: true, user } / { user } 등 다 방어
        const u = (json?.user ?? json?.me ?? json) as Me | null;
        if (!u?.id) {
          router.replace("/login");
          return;
        }
        setMe(u);
      } catch {
        router.replace("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 품목/거래처 로딩 ----------
  useEffect(() => {
    if (!me) return;

    (async () => {
      setErr(null);
      try {
        const [itRes, clRes] = await Promise.all([
          fetch("/api/items", { credentials: "include" }),
          fetch("/api/sales/clients", { credentials: "include" }),
        ]);

        // items
        if (itRes.ok) {
          const itJson = await itRes.json().catch(() => []);
          setItems(Array.isArray(itJson) ? itJson : itJson?.items ?? []);
        } else {
          setItems([]);
        }

        // clients
        if (clRes.ok) {
          const clJson = await clRes.json().catch(() => []);
          setClients(Array.isArray(clJson) ? clJson : clJson?.clients ?? []);
        } else {
          setClients([]);
          // 관리자면 이 API가 막혀있을 수 있어서 에러 문구는 약하게
          setErr(me.role === "ADMIN" ? "거래처 목록은 ‘거래처’ 메뉴에서 확인하세요." : "거래처를 불러오지 못했습니다. (권한/세션 확인)");
        }
      } catch {
        setErr("서버 오류");
      }
    })();
  }, [me]);

  const filteredClients = useMemo(() => {
    const q = clientQ.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientQ]);

  const filteredItems = useMemo(() => {
    const q = itemQ.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, itemQ]);

  // ---------- 주문 요청 ----------
  async function submitOrder() {
    setErr(null);
    if (!me?.id) return setErr("세션이 없습니다. 다시 로그인 해주세요.");
    if (!itemId) return setErr("품목을 선택해주세요.");
    if (!receiverName.trim()) return setErr("수하인명을 입력해주세요.");
    if (!address.trim()) return setErr("주소를 입력해주세요.");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // ✅ 서버 구현이 userId를 요구하는 버전/세션에서 읽는 버전 둘 다 대응
          userId: me.id,
          itemId,
          quantity: qty,
          clientId: clientId || null,
          receiverName,
          receiverAddr: address,
          receiverPhone: onlyDigits(receiverPhone),
          note: memo || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json?.error || json?.message || "주문 요청 실패");
        return;
      }

      setMemo("");
      setQty(1);
      setReceiverName("");
      setReceiverPhone("");
      setAddress("");
      alert("주문 요청 완료!");
      router.replace("/orders?tab=order");
    } catch {
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  }

  // ---------- 조회(내 주문 리스트) ----------
  async function loadHistory() {
    if (!me) return;
    setErr(null);
    setLoadingHistory(true);

    try {
      // SALES: /api/sales/orders (너 라우트 목록에 있음)
      // ADMIN: 일단 sales API 막혀있으면 에러 띄우고, 나중에 admin 전용 조회는 /admin 에서 처리
      const url =
        me.role === "SALES"
          ? "/api/sales/orders"
          : "/api/sales/orders"; // 관리자도 가능하면 보여주고, 막히면 에러 표시

      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setHistory([]);
        setErr(json?.error || json?.message || "조회 권한이 없거나 서버 오류입니다.");
        return;
      }

      // 형태 방어: {orders} / {ok, orders} / 배열
      const list = Array.isArray(json) ? json : json?.orders ?? json?.data ?? [];
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setErr("서버 오류");
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    if (tab !== "history") return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, tab]);

  const filteredHistory = useMemo(() => {
    let list = history;

    if (statusFilter) {
      list = list.filter((o: any) => String(o?.status ?? "") === statusFilter);
    }

    const q = historyQ.trim().toLowerCase();
    if (!q) return list;

    return list.filter((o: any) => {
      const itemName = String(o?.item?.name ?? o?.itemName ?? "").toLowerCase();
      const recv = String(o?.receiverName ?? "").toLowerCase();
      const addr = String(o?.receiverAddr ?? "").toLowerCase();
      return itemName.includes(q) || recv.includes(q) || addr.includes(q);
    });
  }, [history, historyQ, statusFilter]);

  // ---------- 화면 ----------
  return (
    <AppShell>
      {/* 상단바 (로그아웃/탭) */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className={sectionTitle}>주문</div>
          <div className={subTitle}>
            {me ? (
              <>
                <span className="font-black text-white/80">{me.name}</span>
                <span className="text-white/40"> · </span>
                <span className="font-black text-white/60">{me.role === "ADMIN" ? "관리자" : "영업사원"}</span>
              </>
            ) : (
              "세션 확인 중..."
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={cx(btnGhost, tab === "order" && "bg-white/15")} onClick={() => goTab("order")}>
            주문요청
          </button>
          <button className={cx(btnGhost, tab === "history" && "bg-white/15")} onClick={() => goTab("history")}>
            조회
          </button>
          <button className={btnGhost} onClick={() => router.push("/clients/new")}>
            거래처 등록
          </button>
          <button className={btn} onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 에러 */}
      {err ? (
        <div className="mb-5 rounded-2xl border border-red-200/40 bg-red-500/15 px-4 py-3 font-extrabold text-red-200">
          {err}
        </div>
      ) : null}

      {/* 조회 탭 */}
      {tab === "history" ? (
        <div className={card}>
          <div className={cardInner}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xl font-black text-white">조회</div>
                <div className="mt-1 text-sm font-bold text-white/60">내 주문 요청 내역을 확인합니다.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={btnGhost} onClick={loadHistory} disabled={loadingHistory}>
                  {loadingHistory ? "불러오는 중..." : "새로고침"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className={label}>검색</div>
                <input
                  className={input}
                  value={historyQ}
                  onChange={(e) => setHistoryQ(e.target.value)}
                  placeholder="품목/수하인/주소 검색"
                />
              </div>
              <div>
                <div className={label}>상태</div>
                <select className={select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">전체</option>
                  <option value="REQUESTED">대기</option>
                  <option value="APPROVED">승인</option>
                  <option value="REJECTED">거절</option>
                  <option value="DONE">출고완료</option>
                  <option value="SHIPPED">배송완료</option>
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[820px] text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs font-black text-white/70">
                    <th className="px-4 py-3">일자</th>
                    <th className="px-4 py-3">품목</th>
                    <th className="px-4 py-3">수량</th>
                    <th className="px-4 py-3">수하인</th>
                    <th className="px-4 py-3">주소</th>
                    <th className="px-4 py-3">상태</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-white/85">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-white/50" colSpan={6}>
                        {loadingHistory ? "불러오는 중..." : "데이터가 없습니다."}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((o: any) => {
                      const dt = o?.createdAt ? new Date(o.createdAt) : null;
                      const dateStr = dt ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}` : "-";
                      const itemName = o?.item?.name ?? o?.itemName ?? "-";
                      const status = String(o?.status ?? "-");
                      const statusKo =
                        status === "REQUESTED"
                          ? "대기"
                          : status === "APPROVED"
                          ? "승인"
                          : status === "REJECTED"
                          ? "거절"
                          : status === "DONE"
                          ? "출고완료"
                          : status === "SHIPPED"
                          ? "배송완료"
                          : status;

                      return (
                        <tr key={o?.id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white/70">{dateStr}</td>
                          <td className="px-4 py-3">{itemName}</td>
                          <td className="px-4 py-3">{o?.quantity ?? 1}</td>
                          <td className="px-4 py-3">{o?.receiverName ?? "-"}</td>
                          <td className="px-4 py-3 text-white/70">{o?.receiverAddr ?? "-"}</td>
                          <td className="px-4 py-3">{statusKo}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 안내 */}
            <div className="mt-4 text-xs font-bold text-white/50">
              ※ 조회 API가 막혀있다면 “권한/세션” 문제라서, 그건 API 쪽에서 SALES/ADMIN 허용을 같이 맞춰야 합니다.
            </div>
          </div>
        </div>
      ) : (
        // 주문요청 탭
        <div className={card}>
          <div className={cardInner}>
            <div className="text-xl font-black text-white">주문요청</div>
            <div className="mt-1 text-sm font-bold text-white/60">거래처/품목 선택 + 배송정보 입력 후 주문요청</div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className={label}>거래처 검색</div>
                <input
                  className={input}
                  value={clientQ}
                  onChange={(e) => setClientQ(e.target.value)}
                  placeholder="거래처 검색 (이름/대표자)"
                />
              </div>

              <div className="md:col-span-2">
                <div className={label}>거래처(선택)</div>
                <select className={select} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">(선택안함)</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className={label}>품목 검색</div>
                <input className={input} value={itemQ} onChange={(e) => setItemQ(e.target.value)} placeholder="품목 검색" />
              </div>

              <div className="md:col-span-2">
                <div className={label}>품목</div>
                <select className={select} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                  <option value="">(선택)</option>
                  {filteredItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className={label}>수량</div>
                <input
                  className={input}
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>

              <div>
                <div className={label}>수하인명</div>
                <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="예: 홍길동" />
              </div>

              <div>
                <div className={label}>전화번호</div>
                <input
                  className={input}
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(onlyDigits(e.target.value))}
                  placeholder="숫자만"
                  inputMode="numeric"
                />
              </div>

              <div>
                <div className={label}>주소 전체</div>
                <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 경기도 시흥시 ..." />
              </div>

              <div className="md:col-span-2">
                <div className={label}>배송메세지(선택)</div>
                <input className={input} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 취급주의" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <button className={btnGhost} onClick={() => router.push("/clients")} title="거래처 목록 보기">
                거래처 목록
              </button>

              <button disabled={loading} onClick={submitOrder} className={btn}>
                {loading ? "요청 중..." : "주문 요청"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}