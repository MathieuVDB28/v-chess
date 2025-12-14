import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react"
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from '@/components/providers/AuthProvider';
import { ClientComponents } from '@/components/ClientComponents';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "v-chess",
  description: "Track yours chess stats and make yours goals !",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'v-chess',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#47C47E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body
                className={inter.className}
            >
                <main className="mx-auto max-w-5xl w-full px-4">
                    <AuthProvider>
                        {children}
                        <ClientComponents />
                    </AuthProvider>
                    <Analytics />
                </main>
            </body>
        </html>
    );
}
