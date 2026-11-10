import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chick Farm Pro | Poultry Management",
  description: "Track flocks, daily egg logs, feed intake, and net profit.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chick Farm Pro",
  },
  icons: {
    icon: "/chick-farm-pro-app-icon.svg",
    apple: "/chick-farm-pro-app-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#45543c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full w-full bg-[#fbf9f4] m-0 p-0 text-sm md:text-[18px] leading-relaxed overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}