import "./globals.css";

export const metadata = {
  title: "한의N원외탕전 ERP",
  description: "한의N원외탕전 ERP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="erp-bg erp-safe">
        {children}
      </body>
    </html>
  );
}