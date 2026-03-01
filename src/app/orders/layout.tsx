export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="erp-shell">
      <div className="erp-card">{children}</div>
    </div>
  );
}