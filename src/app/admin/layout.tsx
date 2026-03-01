export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg">
      <div className="app-inner">
        <div className="page-wrap">{children}</div>
      </div>
    </div>
  );
}