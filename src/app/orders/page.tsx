import OrdersClient from "./OrdersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function OrdersPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  return <OrdersClient initialTab={searchParams?.tab ?? "request"} />;
}