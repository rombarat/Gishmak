import type { Metadata, Viewport } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

const frank = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700", "900"], variable: "--font-frank", display: "swap" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-assistant", display: "swap" });

export const metadata: Metadata = {
  title: { default: "גישמאק — אוכל מוכן לשבת בקריית יערים", template: "%s · גישמאק" },
  description: "צ׳ולנט, קוגלים, סלטים ביתיים, הערינג וחלות. מזמינים מראש באתר ואוספים בחמישי או בשישי.",
  icons: { icon: "/images/logo-mark.png" },
};

export const viewport: Viewport = { themeColor: "#17130f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={`${frank.variable} ${assistant.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
