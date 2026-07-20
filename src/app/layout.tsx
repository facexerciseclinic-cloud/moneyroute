import type { Metadata } from "next";
import { Prompt, JetBrains_Mono, Silkscreen } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/analytics/meta-pixel";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const monoBrand = JetBrains_Mono({
  variable: "--font-mono-brand",
  subsets: ["latin"],
  display: "swap",
});

const pixel = Silkscreen({
  variable: "--font-pixel-brand",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROOTMAN MONEY ROUTE — เส้นทางสร้างรายได้ที่เหมาะกับคุณ",
  description:
    "คุณไม่ได้หาเงินไม่เก่ง คุณอาจแค่กำลังเล่นเกมที่ไม่เหมาะกับตัวเอง — ระบบวิเคราะห์และออกแบบเส้นทางสร้างรายได้เฉพาะบุคคล",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} ${monoBrand.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
