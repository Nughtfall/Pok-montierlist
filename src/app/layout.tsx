import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = { title:{ default:"PokeTierlist — Pokémon Champions Competitive Intelligence", template:"%s | PokeTierlist" }, description:"Verified Pokémon Champions tier lists, regulations, team building, analysis, and community rankings." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}><body><div className="app-shell"><Header /><Sidebar /><main className="app-main"><div className="content">{children}</div></main></div></body></html>;
}
