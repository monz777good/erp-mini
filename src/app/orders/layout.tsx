import SalesTopNav from "@/components/SalesTopNav";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SalesTopNav />
      <main style={{ maxWidth:1200, margin:"0 auto", padding:24 }}>
        {children}
      </main>
    </>
  );
}