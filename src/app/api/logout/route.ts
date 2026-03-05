import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  clearSession();
  return NextResponse.redirect("http://localhost:8080/login");
}

export async function POST() {
  clearSession();
  return NextResponse.redirect("http://localhost:8080/login");
}