"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  ownerName?: string;
  bizRegNo?: string;
  careInstitutionNo?: string;

  receiverName?: string;
  receiverAddr?: string;
  receiverTel?: string;
  receiverMobile?: string;

  memo?: string;

  bizFileName?: string | null;
};

export default function ClientsPage() {

  const [clients,setClients] = useState<Client[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const res = await fetch("/api/sales/clients",{credentials:"include"});
    const data = await res.json();

    if(data.ok){
      setClients(data.clients);
    }

    setLoading(false);
  }

  async function viewBizFile(id:string){
    const res = await fetch(`/api/sales/clients/${id}/bizfile`,{
      credentials:"include"
    });

    const data = await res.json();

    if(!data.ok){
      alert("파일 없음");
      return;
    }

    window.open(data.url,"_blank");
  }

  function downloadBizFile(id:string){
    window.open(`/api/sales/clients/${id}/bizfile?download=1`);
  }

  if(loading){
    return <div>로딩중...</div>;
  }

  return (
    <div>

      <h2>거래처 목록</h2>

      <div style={{marginBottom:20}}>
        <Link href="/clients/new">
          <button>거래처 등록</button>
        </Link>
      </div>

      <table border={1} cellPadding={10}>

        <thead>
          <tr>
            <th>거래처명</th>
            <th>대표자</th>
            <th>사업자번호</th>
            <th>요양기관번호</th>
            <th>수하인</th>
            <th>주소</th>
            <th>사업자등록증</th>
          </tr>
        </thead>

        <tbody>

          {clients.map(c=>(
            <tr key={c.id}>

              <td>{c.name}</td>
              <td>{c.ownerName}</td>
              <td>{c.bizRegNo}</td>
              <td>{c.careInstitutionNo}</td>

              <td>{c.receiverName}</td>
              <td>{c.receiverAddr}</td>

              <td>

                {c.bizFileName ? (
                  <>
                    <button onClick={()=>viewBizFile(c.id)}>보기</button>
                    <button onClick={()=>downloadBizFile(c.id)}>다운</button>
                  </>
                ) : (
                  "없음"
                )}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}