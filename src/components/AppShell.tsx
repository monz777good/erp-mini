// src/components/AppShell.tsx
import React from "react";

type Props = {
  children: React.ReactNode;
  title?: string; // ✅ title prop 허용
};

export default function AppShell({ children, title }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {title && (
          <h1 className="mb-6 text-2xl font-bold tracking-wide">
            {title}
          </h1>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}