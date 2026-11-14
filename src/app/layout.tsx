import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SyncProvider } from "@/providers/SyncProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS — AI Operating System",
  description:
    "NEXUS is a futuristic, AI-powered operating system that runs entirely in your browser. Window manager, 3D space environment, AI assistant, code studio and more.",
  keywords: [
    "NEXUS",
    "AI operating system",
    "web OS",
    "Three.js",
    "React Three Fiber",
    "AI assistant",
    "futuristic UI",
  ],
  authors: [{ name: "NEXUS" }],
  openGraph: {
    title: "NEXUS — AI Operating System",
    description: "A futuristic AI operating system in your browser.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060810",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark`}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <SyncProvider>
              <ThemeProvider>
                <div id="nexus-root">{children}</div>
              </ThemeProvider>
            </SyncProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
