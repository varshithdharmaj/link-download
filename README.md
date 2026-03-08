# Aesthetic Media Downloader

A premium, glassmorphic web application built with [Next.js](https://nextjs.org/) and Vanilla CSS to extract and download high-quality videos and images from any link (YouTube, Twitter, TikTok, etc.).

## 🚀 Live Demo

**[View the Live Application Here](https://link-wheat-one.vercel.app/)**

## ✨ Features

- **Universal Media Extraction**: Powered by the robust [yt-dlp](https://github.com/yt-dlp/yt-dlp) (via `youtube-dl-exec`), download high-quality videos and images from YouTube, Instagram (Reels & Posts), Facebook, Twitter (X), TikTok, Reddit, and thousands of other sites.
- **Direct File Detection**: Automatically identifies direct links to images, videos, and documents for instant downloading.
- **Generic Fallback**: If a specialized extractor isn't available, we provide a direct download link for any valid URL.
- **Premium Aesthetic**: Features a clean, airy "Light Mode" aesthetic with dynamic, animated ambient blobs shifting in soft indigo, purple, and fuchsia gradients.
- **Glassmorphism Design**: High-end UI featuring backdrop blurs, soft shadows, and clean typography. 
- **Micro-interactions**: Buttery-smooth mount and spring animations powered by Framer Motion.
- **Fully Responsive**: Adapts perfectly to mobile and desktop screens using modern CSS capabilities.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Extraction Engine**: yt-dlp (via youtube-dl-exec)
- **Styling**: Vanilla CSS (CSS Variables, Grid, Flexbox)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 💻 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/varshithdharmaj/link-download.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server locally:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
