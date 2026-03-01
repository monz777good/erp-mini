export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="erp-page">
      <div className="erp-container">{children}</div>
    </div>
  );
}