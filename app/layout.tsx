import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Aesthetic Downloader | Extract Video & Images",
    description: "A premium glassmorphic web tool to extract and download high-quality videos and images from any link.",
    keywords: ["video downloader", "image extractor", "youtube downloader", "aesthetic web app"],
    authors: [{ name: "Aesthetic Dev" }],
    viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
