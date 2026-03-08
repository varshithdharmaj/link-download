"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Link as LinkIcon, AlertCircle, Loader2, CheckCircle2, PlayCircle, Image as ImageIcon } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}: Failed to extract media`);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (fileUrl: string, filename: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback to direct link if blob fetch fails (CORS etc)
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <main className="container" style={{ minHeight: "100vh", padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Ambient Animated Background */}
      <div className="ambient-bg">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: "center", marginBottom: "3rem", marginTop: "2rem" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "rgba(0,0,0,0.03)", borderRadius: "100px", border: "1px solid rgba(0,0,0,0.05)", marginBottom: "1.5rem" }}
        >
          <span className="text-gradient" style={{ fontSize: "0.875rem", fontWeight: 500 }}>✨ The Ultimate Media Extractor</span>
        </motion.div>

        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem", lineHeight: 1.1 }}>
          Download <span className="text-gradient-accent">Anything.</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "clamp(1rem, 3vw, 1.125rem)", maxWidth: "600px", margin: "0 auto", padding: "0 1rem" }}>
          Paste a link from YouTube, Instagram, Facebook, Twitter, Reddit, or any valid URL. We'll extract the media or provide a direct download instantly.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Platform Selection Tabs (Visual Only) */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "-0.5rem" }}>
          {[
            { id: 'insta', label: 'Instagram', color: '#E4405F' },
            { id: 'yt', label: 'YouTube', color: '#FF0000' },
            { id: 'tt', label: 'TikTok', color: '#000000' },
            { id: 'tw', label: 'Twitter', color: '#1DA1F2' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'insta') setUrl("https://www.instagram.com/p/...");
                else if (tab.id === 'yt') setUrl("https://www.youtube.com/watch?v=...");
              }}
              className="glass-panel"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                background: url.includes(tab.label.toLowerCase()) ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                borderColor: url.includes(tab.label.toLowerCase()) ? tab.color : "rgba(0,0,0,0.05)",
                color: url.includes(tab.label.toLowerCase()) ? tab.color : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          className="glass-panel"
          style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
          onSubmit={handleDownload}
        >
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
              <LinkIcon size={20} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Instagram Reel, YouTube Link, or any URL..."
              className="glass-input"
              style={{ paddingLeft: "3rem" }}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {url.toLowerCase().includes('instagram') ? 'Connecting to Instagram...' :
                  url.toLowerCase().includes('youtube') ? 'Fetching YouTube Data...' :
                    'Extracting Media Magic...'}
              </>
            ) : (
              <>
                <Download size={20} />
                Download Media
              </>
            )}
          </button>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            style={{ overflow: "hidden", marginTop: "1.5rem", width: "100%", maxWidth: "700px" }}
          >
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "16px", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "#ef4444" }}>
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass-panel"
            style={{ marginTop: "2rem", width: "100%", maxWidth: "700px", overflow: "hidden" }}
          >
            {/* Integrated Media Player / Preview */}
            {(() => {
              const videoExts = ['mp4', 'webm', 'mov', 'm4v'];
              const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];

              const videoFormat = result.formats?.find((f: any) => f.type === 'video' || videoExts.includes(f.ext?.toLowerCase()));
              const audioFormat = result.formats?.find((f: any) => f.type === 'audio' || audioExts.includes(f.ext?.toLowerCase()));

              const isVideo = !!videoFormat || result.type === 'video';
              const isAudio = !!audioFormat || result.type === 'audio';
              const previewUrl = videoFormat?.url || audioFormat?.url || result.url;

              if (isVideo) {
                return (
                  <div style={{ width: "100%", padding: "1.5rem 2rem 0" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Video Preview</h4>
                    <video
                      controls
                      className="glass-panel"
                      style={{ width: "100%", borderRadius: "12px", background: "#000", maxHeight: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
                      poster={result.thumbnail}
                      key={previewUrl}
                    >
                      <source src={previewUrl} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                );
              }

              if (isAudio) {
                return (
                  <div style={{ width: "100%", padding: "1.5rem 2rem 0" }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>Audio Preview</h4>
                    <audio
                      controls
                      style={{ width: "100%" }}
                      key={previewUrl}
                    >
                      <source src={previewUrl} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              }

              if (result.thumbnail) {
                return (
                  <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", overflow: "hidden", background: "#000" }}>
                    <img
                      src={result.thumbnail}
                      alt={result.title || "Media Preview"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                    />
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />

                    <div style={{ position: "absolute", bottom: "1.5rem", left: "1.5rem", right: "1.5rem" }}>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {result.title || "Extracted Media"}
                      </h3>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CheckCircle2 size={16} />
                        Ready to save
                      </p>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Grouping by Video/Audio/Image */}
                {['video', 'audio', 'image', 'file'].map((category) => {
                  const filtered = result.formats?.filter((f: any) => f.type === category);
                  if (!filtered || filtered.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {category === 'video' && <PlayCircle size={14} />}
                        {category === 'audio' && <Loader2 size={14} />}
                        {category === 'image' && <ImageIcon size={14} />}
                        {category} Results
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                        {filtered.map((format: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleDownloadFile(format.url, `${result.title || 'media'}-${format.quality || idx}.${format.ext}`)}
                            style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "1rem", textDecoration: "none", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s ease", cursor: "pointer", textAlign: "left", width: "100%" }}
                            onMouseOver={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.06)";
                              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)";
                            }}
                            onMouseOut={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)";
                              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.05)";
                            }}
                          >
                            <div style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)", padding: "0.75rem", borderRadius: "10px" }}>
                              {format.type === 'video' ? <PlayCircle size={24} /> : (format.type === 'image' ? <ImageIcon size={24} /> : <Download size={24} />)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "1rem" }}>{format.quality || "Original"}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                {format.ext} {format.filesize ? `• ${(format.filesize / 1024 / 1024).toFixed(1)} MB` : ''}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {(!result.formats || result.formats.length === 0) && result.url && (
                  <div style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleDownloadFile(result.url, `${result.title || 'media'}.${result.ext || 'mp4'}`)}
                      className="btn-primary"
                      style={{ textDecoration: "none", display: "inline-flex", cursor: "pointer" }}
                    >
                      <Download size={20} />
                      Download Result
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer style={{ marginTop: "4rem", padding: "2rem", borderTop: "1px solid rgba(0,0,0,0.05)", width: "100%", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        <p>© 2026 Media Downloader • Version 1.1.7</p>
      </footer>
    </main>
  );
}
