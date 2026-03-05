import { NextResponse } from "next/server";

function makeLogoutResponse(req: Request) {
  const res = NextResponse.json({ ok: true });

  //        (  100% )
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => v.split("=")[0]?.trim())
    .filter(Boolean);

  //  
  const unique = Array.from(new Set(cookieNames));

  for (const name of unique) {
    // path "/"   (  )
    res.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    });

    //   path    (Next  /api   )
    res.cookies.set({
      name,
      value: "",
      path: "/api",
      maxAge: 0,
    });
  }

  return res;
}

export async function POST(req: Request) {
  return makeLogoutResponse(req);
}

export async function GET(req: Request) {
  return makeLogoutResponse(req);
}
