import "./globals.css";

export const metadata = {
  title: "한의N원외탕전 ERP",
  description: "ERP System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}