import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "DivToVid — Divs to Vids Engine",
  description:
    "DivToVid: Premium Multimodal Video Crawler & AI Filtering Machine. Transform semantic search into the top 3 most accurate videos across YouTube, TikTok, and X.",
  keywords: ["video search", "AI video filter", "multimodal", "yt-dlp", "DivToVid"],
  openGraph: {
    title: "DivToVid — Divs to Vids Engine",
    description: "AI-powered video discovery & filtering platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#080c14] text-slate-100 antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "bg-slate-900 border border-slate-700 text-slate-100",
              title: "text-slate-100",
              description: "text-slate-400",
            },
          }}
        />
      </body>
    </html>
  );
}
