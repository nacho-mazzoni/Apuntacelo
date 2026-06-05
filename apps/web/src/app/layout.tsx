import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/navbar";
import { WalletProvider } from "@/components/wallet-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apuntacelo",
  description:
    "new way to buy &quot;Apuntes&quot; for university between students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar is included on all pages */}
        <div className="relative flex min-h-screen flex-col">
          <WalletProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
