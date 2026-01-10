import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/contexts/theme-context";

export const metadata: Metadata = {
  title: "Secure Attendance System",
  description: "Role-Based Attendance Management",
};

import { NanoBackground } from '@/components/ui/nano-background';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased min-h-screen bg-background text-foreground font-sans`}>
        <ThemeProvider>
          <NanoBackground />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
