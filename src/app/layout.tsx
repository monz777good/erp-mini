export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="erp-page">{children}</div>
      </body>
    </html>
  );
}