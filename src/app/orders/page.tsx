import OrdersClient from "./OrdersClient";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  return <OrdersClient isAdmin={session?.role === "ADMIN"} />;
}
