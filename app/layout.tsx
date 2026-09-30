import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PocketDAO — Your group wallet, without the spreadsheet.",
  description: "A lightweight community treasury with simple onchain voting on BOT Chain.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/pocketdao-logo.png",
  },
  openGraph: {
    title: "PocketDAO",
    description: "A lightweight community treasury on BOT Chain.",
    images: ["/pocketdao-logo.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
