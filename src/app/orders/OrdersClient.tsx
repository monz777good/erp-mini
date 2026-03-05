"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
};

type Item = {
  id: string;
  name: string;
};

export default function OrdersClient() {
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [clientId, setClientId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadItems();
  }, []);

  async function loadClients() {
    const res = await fetch("/api/sales/clients", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setClients(data.clients);
  }

  async function loadItems() {
    const res = await fetch("/api/items", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setItems(data.items);
  }

  async function submitOrder() {
    if (!clientId) {
      alert("거래처 선택");
      return;
    }

    if (!itemId) {
      alert("품목 선택");
      return;
    }

    if (!receiverName || !receiverAddr) {
      alert("수하인 정보 입력");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        itemId,
        quantity,
        receiverName,
        receiverAddr,
        phone,
        mobile,
        note,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!data.ok) {
      alert("주문 실패");
      return;
    }

    alert("주문 요청 완료");

    setQuantity(1);
    setReceiverName("");
    setReceiverAddr("");
    setPhone("");
    setMobile("");
    setNote("");
  }

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-bold">주문 요청</h2>

      <div>
        <label>거래처</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">선택</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>품목</label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        >
          <option value="">선택</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>수량</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <div>
        <label>수하인</label>
        <input
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
        />
      </div>

      <div>
        <label>주소</label>
        <input
          value={receiverAddr}
          onChange={(e) => setReceiverAddr(e.target.value)}
        />
      </div>

      <div>
        <label>전화</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label>휴대폰</label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>

      <div>
        <label>메모</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button onClick={submitOrder} disabled={loading}>
        {loading ? "요청중..." : "주문 요청"}
      </button>

    </div>
  );
}