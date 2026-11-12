import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Cineverse — Your Cinema, Everywhere", description: "Discover your next favorite film on Cineverse." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
