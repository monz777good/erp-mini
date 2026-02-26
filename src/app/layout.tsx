import "./globals.css";

export const metadata = {
  title: "ERP",
  description: "ERP Mini",
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