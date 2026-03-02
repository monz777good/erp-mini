// src/app/clients/new/page.tsx
import NewClientClient from "./NewClientClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NewClientPage() {
  return <NewClientClient />;
}