import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: any) {
  return String(v ?? "").trim();
}

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const q = s(searchParams.get("q")).toLowerCase();

    // public 파일 URL
    const fileUrl = new URL("/ecount_clients.xlsx", req.url).toString();

    const res = await fetch(fileUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "엑셀 파일을 불러올 수 없습니다.",
          rows: [],
        },
        { status: 500 }
      );
    }

    const buffer = await res.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      range: 1,
      defval: "",
    });

    const rows = rawRows
      .map((row, idx) => {
        const name = pick(row, ["거래처명"]);
        const bizRegNo = pick(row, ["거래처코드"]);
        const address = pick(row, ["주소1"]);
        const ownerName = pick(row, ["대표자명"]);
        const phone = pick(row, ["전화"]);
        const mobile = pick(row, ["모바일"]);
        const note = pick(row, ["검색창내용"]);

        return {
          id: `excel-${idx + 1}`,
          createdAt: "",
          name,
          bizRegNo: bizRegNo || null,
          careInstitutionNo: null,
          address: address || null,
          phone: phone || null,
          mobile: mobile || null,
          ownerName: ownerName || null,
          note: note || null,
        };
      })
      .filter((row) => row.name);

    const filtered = q
      ? rows.filter((row) => row.name.toLowerCase().includes(q))
      : rows;

    return NextResponse.json({
      ok: true,
      rows: filtered,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "UNKNOWN_ERROR",
        rows: [],
      },
      { status: 500 }
    );
  }
}