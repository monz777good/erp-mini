import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 font-bold">로딩 중...</div>}>
      <OrdersClient />
    </Suspense>
  );
}