import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notion Wrapped",
  description: "A silly wrapped for FY 2023",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{ backgroundImage: "url(/backgrounds/bg.png)" }}
        className={`bg-[length:550px_550px] ${inter.className} bg-repeat`}
      >
        {children}
      </body>
    </html>
  );
}
