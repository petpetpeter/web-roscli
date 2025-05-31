import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import React from 'react';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ROS 2 CLI UI",
  description: "Web interface for ROS 2 command line tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
