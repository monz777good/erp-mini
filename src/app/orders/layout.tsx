// src/app/orders/layout.tsx
import React from "react";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  // ✅ orders 라우트에서는 불필요한 텍스트/여백/중복 헤더를 절대 출력하지 않음
  return <>{children}</>;
}