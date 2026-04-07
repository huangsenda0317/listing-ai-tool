import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listing AI Tool",
  description: "跨境电商 Listing 生成 / 翻译（内部工具）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
