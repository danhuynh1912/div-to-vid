import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
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
        className={`${outfit.variable} font-sans bg-[#0b1220] text-slate-100 antialiased`}
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
