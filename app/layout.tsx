import type { Metadata } from "next";
import localFont from "next/font/local";
import { NotificationProvider } from "@/context/NotificationContext";
import Toaster from "@/components/Toaster";
import "./globals.css";
import { Footer } from "@/components/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Mathematics Department",
  description: "Election portal for the Department of Mathematics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
        <Footer />
      </body>
    </html>
  );
}
