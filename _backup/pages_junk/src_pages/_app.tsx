// src/pages/_app.tsx
import type { AppProps } from "next/app";

// ✅ App Router의 글로벌 CSS를 Pages Router에도 적용
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}