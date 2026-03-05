import OrdersClient from "./OrdersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersClient />;
}