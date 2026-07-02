import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountKey = "hana" | "ibk" | "kb" | "none";

const ACCOUNTS: Record<AccountKey, string> = {
  hana: "하나은행 871-910010-06204 송현준",
  ibk: "기업은행 106-054551-04019 송현준",
  kb: "국민은행 202602-04-157713 송영준",
  none: "",
};

function s(value: unknown) {
  return String(value ?? "").trim();
}

function formatStatementDate(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()} 년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}

function comma(value: number) {
  return Math.round(value || 0).toLocaleString("ko-KR");
}

function makeGroupKey(order: any) {
  return [
    order.createdAt?.toISOString?.() ?? String(order.createdAt),
    order.userId,
    order.clientId,
    s(order.receiverName),
    s(order.receiverAddr),
    s(order.phone),
    s(order.mobile),
    s(order.note),
    s(order.specYN),
    s(order.status),
  ].join("|");
}

async function getStatementGroups(ids: string[]) {
  const baseOrders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: {
      item: true,
      client: true,
      user: true,
    },
  });

  const used = new Set<string>();
  const groups: Array<{
    base: any;
    lines: Array<{ name: string; qty: number; price: number; amount: number }>;
    qtyTotal: number;
    total: number;
  }> = [];

  for (const base of baseOrders as any[]) {
    const key = makeGroupKey(base);
    if (used.has(key)) continue;
    used.add(key);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: base.createdAt,
        userId: base.userId,
        clientId: base.clientId,
        receiverName: base.receiverName,
        receiverAddr: base.receiverAddr,
        phone: base.phone,
        mobile: base.mobile,
        note: base.note,
        specYN: base.specYN,
        status: base.status,
      },
      include: {
        item: true,
        client: true,
        user: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const itemMap = new Map<string, { name: string; qty: number; price: number; amount: number }>();

    for (const order of orders as any[]) {
      const itemId = s(order.itemId || order.item?.id || "");
      const name = s(order.item?.name || order.itemName || "-") || "-";
      const qty = Math.max(1, Number(order.quantity ?? 1) || 1);
      const price = Math.max(0, Number(order.item?.price ?? 0) || 0);
      const keyForItem = itemId || name;
      const prev = itemMap.get(keyForItem);

      if (prev) {
        prev.qty += qty;
        prev.amount = prev.qty * prev.price;
      } else {
        itemMap.set(keyForItem, { name, qty, price, amount: qty * price });
      }
    }

    const lines = Array.from(itemMap.values()).slice(0, 11);
    const qtyTotal = lines.reduce((sum, line) => sum + line.qty, 0);
    const total = lines.reduce((sum, line) => sum + line.amount, 0);

    groups.push({ base, lines, qtyTotal, total });
  }

  return groups;
}

export default async function StatementPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; account?: string }>;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const sp = await searchParams;
  const ids = s(sp.ids)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const accountKey = (s(sp.account) || "hana") as AccountKey;
  const accountText = ACCOUNTS[accountKey] ?? ACCOUNTS.hana;
  const statements = ids.length ? await getStatementGroups(ids) : [];

  return (
    <main>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          background: #eef7ef;
          color: #111827;
          font-family: Arial, "Malgun Gothic", sans-serif;
        }

        .toolbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: #ffffff;
          border-bottom: 1px solid #bbf7d0;
          box-shadow: 0 8px 24px rgba(22, 101, 52, 0.08);
        }

        .toolbar a,
        .toolbar button {
          min-height: 44px;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          background: #ffffff;
          color: #0f172a;
          padding: 10px 16px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
        }

        .toolbar .print {
          border-color: #059669;
          background: #059669;
          color: #ffffff;
        }

        .empty {
          max-width: 720px;
          margin: 48px auto;
          border: 1px solid #bbf7d0;
          border-radius: 18px;
          background: #ffffff;
          padding: 28px;
          text-align: center;
          font-weight: 900;
        }

        .page-wrap {
          width: 100%;
          overflow-x: auto;
          padding: 18px 10px 36px;
        }

        .page {
          width: 760px;
          min-height: 1060px;
          margin: 0 auto 24px;
          background: #ffffff;
          padding: 22px;
          box-shadow: 0 16px 45px rgba(15, 23, 42, 0.14);
          page-break-after: always;
        }

        .sheet {
          border: 2px solid #111827;
          background: #ffffff;
          color: #111827;
        }

        .title {
          padding: 24px 0 26px;
          text-align: center;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 8px;
        }

        .top {
          display: grid;
          grid-template-columns: 48% 8% 44%;
          min-height: 228px;
          border-top: 2px solid #111827;
          border-bottom: 2px solid #111827;
        }

        .buyer {
          padding: 38px 28px 20px;
          border-right: 2px solid #111827;
        }

        .date {
          font-size: 17px;
          font-weight: 900;
          margin-bottom: 54px;
        }

        .client {
          min-height: 40px;
          font-size: 18px;
          font-weight: 900;
          text-decoration: underline;
        }

        .notice {
          margin-top: 42px;
          font-size: 15px;
          font-weight: 800;
        }

        .supplier-label {
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 2px solid #111827;
          writing-mode: vertical-rl;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 7px;
        }

        .supplier-box {
          position: relative;
        }

        .supplier-stamp {
          position: absolute;
          top: 54px;
          right: 18px;
          width: 54px;
          height: 54px;
          object-fit: contain;
          pointer-events: none;
        }

        .supplier-table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
        }

        .supplier-table th,
        .supplier-table td {
          border-bottom: 1px solid #111827;
          border-right: 1px solid #111827;
          padding: 6px 7px;
          vertical-align: middle;
        }

        .supplier-table th {
          width: 72px;
          text-align: center;
          font-weight: 800;
        }

        .supplier-table td {
          font-weight: 700;
        }

        .supplier-table tr:last-child th,
        .supplier-table tr:last-child td {
          border-bottom: 0;
        }

        .supplier-table td:last-child {
          border-right: 0;
        }

        .supplier-name {
          text-align: center;
          font-size: 14px;
          font-weight: 900 !important;
        }

        .total-band {
          display: grid;
          grid-template-columns: 1fr 180px;
          align-items: center;
          border-bottom: 2px solid #111827;
          background: #cfe2f3;
          min-height: 28px;
          font-weight: 900;
        }

        .total-band div {
          padding: 5px 10px;
        }

        .total-band .amount {
          text-align: right;
          font-size: 16px;
        }

        .items {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 13px;
        }

        .items th,
        .items td {
          height: 24px;
          border-right: 1px solid #111827;
          border-bottom: 1px solid #111827;
          padding: 3px 7px;
          background: #ffffff;
        }

        .items th {
          text-align: center;
          font-weight: 800;
        }

        .items th:last-child,
        .items td:last-child {
          border-right: 0;
        }

        .no-col {
          width: 74px;
          text-align: center;
        }

        .name-col {
          width: auto;
        }

        .qty-col {
          width: 74px;
          text-align: center;
        }

        .price-col,
        .amount-col {
          width: 108px;
          text-align: right;
        }

        .memo-col {
          width: 162px;
        }

        .sum-row td {
          height: 31px;
          border-bottom: 0;
          font-weight: 900;
        }

        .sum-label {
          text-align: center;
        }

        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            background: #ffffff;
          }

          .toolbar {
            display: none;
          }

          .page-wrap {
            overflow: visible;
            padding: 0;
          }

          .page {
            width: 190mm;
            min-height: 277mm;
            margin: 0 auto;
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener("click", function (event) {
              var target = event.target;
              if (target && target.getAttribute && target.getAttribute("data-print") === "1") {
                window.print();
              }
            });
          `,
        }}
      />

      <div className="toolbar">
        <a href="/admin/orders">주문관리로 돌아가기</a>
        <button className="print" type="button" data-print="1">
          프린트
        </button>
      </div>

      {statements.length === 0 ? (
        <div className="empty">출력할 거래명세서가 없습니다.</div>
      ) : (
        <div className="page-wrap">
          {statements.map((statement, index) => {
            const base = statement.base;
            const clientName = s(base.client?.name || base.receiverName || "");
            const rows = Array.from({ length: 11 }, (_, rowIndex) => statement.lines[rowIndex] ?? null);

            return (
              <section className="page" key={`${base.id}_${index}`}>
                <div className="sheet">
                  <div className="title">거 래 명 세 서</div>

                  <div className="top">
                    <div className="buyer">
                      <div className="date">{formatStatementDate(base.createdAt)}</div>
                      <div className="client">{clientName} 귀하</div>
                      <div className="notice">아래와 같이 계산합니다.</div>
                    </div>

                    <div className="supplier-label">공급자</div>

                    <div className="supplier-box">
                      <table className="supplier-table">
                        <tbody>
                          <tr>
                            <th>상호</th>
                            <td className="supplier-name" colSpan={3}>
                              주식회사 몬즈약품유통
                            </td>
                          </tr>
                          <tr>
                            <th>사업자번호</th>
                            <td>560-88-01760</td>
                            <th>대표</th>
                            <td>송 영 준</td>
                          </tr>
                          <tr>
                            <th>사업장주소</th>
                            <td colSpan={3}>경기도 안산시 단원구 연수원로 64, 310호</td>
                          </tr>
                          <tr>
                            <th>업태</th>
                            <td>도소매</td>
                            <th>업종</th>
                            <td>의약품외</td>
                          </tr>
                          <tr>
                            <th>전화/팩스</th>
                            <td colSpan={3}>02-353-7668 /0504-002-1411</td>
                          </tr>
                          <tr>
                            <th>입금계좌</th>
                            <td colSpan={3}>{accountText}</td>
                          </tr>
                          <tr>
                            <th>이메일</th>
                            <td colSpan={3}>monz19ph@gmail.com</td>
                          </tr>
                        </tbody>
                      </table>
                      <img className="supplier-stamp" src="/templates/statement_stamp.jpg" alt="" />
                    </div>
                  </div>

                  <div className="total-band">
                    <div>합계금액 (공급가액+세액)</div>
                    <div className="amount">{comma(statement.total)}</div>
                  </div>

                  <table className="items">
                    <thead>
                      <tr>
                        <th className="no-col">No</th>
                        <th className="name-col">제 품 명</th>
                        <th className="qty-col">수량</th>
                        <th className="price-col">단가</th>
                        <th className="amount-col">금 액</th>
                        <th className="memo-col">비 고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((line, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="no-col">{rowIndex + 1}</td>
                          <td className="name-col">{line?.name ?? ""}</td>
                          <td className="qty-col">{line ? comma(line.qty) : ""}</td>
                          <td className="price-col">{line ? comma(line.price) : ""}</td>
                          <td className="amount-col">{line ? comma(line.amount) : ""}</td>
                          <td className="memo-col" />
                        </tr>
                      ))}
                      <tr className="sum-row">
                        <td className="sum-label" colSpan={2}>
                          계
                        </td>
                        <td />
                        <td />
                        <td className="amount-col">{comma(statement.total)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
