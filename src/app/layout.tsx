import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import Config from "../../config.json";
import { titleCase } from "./helpers/title-case";

export const metadata: Metadata = {
  title: `${titleCase(Config.periodName)} Wrapped for ${Config.teamName}`,
  description: `A silly wrapped`,
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
