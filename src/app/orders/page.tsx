import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 font-black">로딩중...</div>}>
      <OrdersClient />
    </Suspense>
  );
}