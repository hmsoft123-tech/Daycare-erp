import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ColorModeProvider } from "@/components/providers/ColorModeProvider";
import { COLOR_MODE_BOOT_SCRIPT } from "@/lib/color-mode";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Parent Portal · Kinder Pilot",
  description: "Stay connected with your child's daycare — attendance, updates, and fees",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_BOOT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <ColorModeProvider>{children}</ColorModeProvider>
      </body>
    </html>
  );
}
