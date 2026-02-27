// ✅ 경로: src/app/layout.tsx
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 매일 바뀌는 랜덤 배경(가독성 위해 어두운 오버레이)
  const today = new Date().toISOString().slice(0, 10);
  const bg = `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)),
url(https://source.unsplash.com/1920x1080/?mountain,forest,lake,nature&${today})`;

  return (
    <html lang="ko">
      <body className="app-bg" style={{ backgroundImage: bg }}>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}