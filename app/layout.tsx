import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "v-chess",
  description: "Track yours chess stats and make yours goals !",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={inter.className}
        >
            <main className="mx-auto max-w-5xl w-full px-4">
                <AuthProvider>{children}</AuthProvider>
                <Analytics />
            </main>
        </body>
        </html>
    );
}
