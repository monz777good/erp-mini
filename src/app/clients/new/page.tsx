"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [bizRegNo, setBizRegNo] = useState("");
  const [careInstitutionNo, setCareInstitutionNo] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverAddr, setReceiverAddr] = useState("");
  const [receiverTel, setReceiverTel] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");

  const [memo, setMemo] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name) {
      alert("거래처 이름 입력");
      return;
    }

    setLoading(true);

    const form = new FormData();

    form.append("name", name);
    form.append("ownerName", ownerName);
    form.append("bizRegNo", bizRegNo);
    form.append("careInstitutionNo", careInstitutionNo);

    form.append("receiverName", receiverName);
    form.append("receiverAddr", receiverAddr);
    form.append("receiverTel", receiverTel);
    form.append("receiverMobile", receiverMobile);

    form.append("memo", memo);

    if (file) {
      form.append("file", file);
    }

    const res = await fetch("/api/sales/clients", {
      method: "POST",
      credentials: "include",
      body: form,
    });

    const data = await res.json();

    setLoading(false);

    if (!data.ok) {
      alert("등록 실패");
      return;
    }

    alert("거래처 등록 완료");

    router.push("/clients");
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>거래처 등록</h2>

      <input placeholder="거래처명" value={name} onChange={(e)=>setName(e.target.value)} />
      <input placeholder="대표자" value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} />

      <input placeholder="사업자번호" value={bizRegNo} onChange={(e)=>setBizRegNo(e.target.value)} />
      <input placeholder="요양기관번호" value={careInstitutionNo} onChange={(e)=>setCareInstitutionNo(e.target.value)} />

      <input placeholder="수하인" value={receiverName} onChange={(e)=>setReceiverName(e.target.value)} />
      <input placeholder="주소" value={receiverAddr} onChange={(e)=>setReceiverAddr(e.target.value)} />

      <input placeholder="전화" value={receiverTel} onChange={(e)=>setReceiverTel(e.target.value)} />
      <input placeholder="휴대폰" value={receiverMobile} onChange={(e)=>setReceiverMobile(e.target.value)} />

      <input placeholder="메모" value={memo} onChange={(e)=>setMemo(e.target.value)} />

      <div>
        <label>사업자등록증</label>
        <input type="file" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
      </div>

      <button onClick={submit} disabled={loading}>
        {loading ? "저장중..." : "저장"}
      </button>
    </div>
  );
}