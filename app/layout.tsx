import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";

// Be Vietnam Pro hỗ trợ đầy đủ dấu tiếng Việt (ôm, ơ, â, đ...),
// Geist mặc định chỉ có subset latin nên chữ "Hôm nay bạn tập gì?" bị lỗi font.
const sansVN = Be_Vietnam_Pro({
  variable: "--font-sans-vn",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Progression",
  description:
    "Theo dõi buổi tập, tạ và rep mỗi set — tự tăng tạ theo lộ trình progressive overload.",
  // iOS Add to Home Screen: cho phép chạy full màn hình như app nội bộ.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gym Progression",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Cho phép nội dung tràn xuống dưới Dynamic Island / vạch Home bar.
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${sansVN.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
