import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 하루 1번 바뀌는 배경 (그날은 고정)
  const today = new Date().toISOString().slice(0, 10);

  const bg = `
    linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.42)),
    url(https://source.unsplash.com/1920x1080/?mountain,forest,lake,nature&${today})
  `;

  return (
    <html lang="ko">
      <body style={{ backgroundImage: bg }} className="app-bg">
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}