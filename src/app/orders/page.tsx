// ✅ src/app/orders/page.tsx  (통째로 교체)
import OrdersClient from "./OrdersClient";

export default function OrdersPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  return <OrdersClient initialTab={searchParams?.tab ?? "request"} />;
}