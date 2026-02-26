import { Suspense } from "react";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>불러오는 중...</div>}>
      <ReportsClient />
    </Suspense>
  );
}