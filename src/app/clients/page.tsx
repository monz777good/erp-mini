// src/app/clients/page.tsx
import ClientsClient from "./ClientsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return <ClientsClient />;
}