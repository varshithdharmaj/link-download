import { NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";
import axios from "axios";

export async function POST(req: Request) {
    console.log("--- Extracting Link ---");
    try {
        const { url } = await req.json();
        console.log("URL:", url);

        if (!url) {
            return NextResponse.json(
                { error: "Please provide a valid URL" },
                { status: 400 }
            );
        }

        // 1. Check if it's a direct file using HEAD request
        try {
            const headResponse = await axios.head(url, { timeout: 5000 });
            const contentType = headResponse.headers['content-type'];
            const contentLength = headResponse.headers['content-length'];

            // If it's a direct media file or a known downloadable type, we can offer it directly
            if (contentType && (
                contentType.startsWith('video/') ||
                contentType.startsWith('audio/') ||
                contentType.startsWith('image/') ||
                contentType.includes('application/pdf') ||
                contentType.includes('application/zip') ||
                contentType.includes('application/octet-stream')
            )) {
                return NextResponse.json({
                    title: url.split('/').pop() || "Direct File",
                    thumbnail: contentType.startsWith('image/') ? url : null,
                    url: url,
                    formats: [{
                        url: url,
                        ext: contentType.split('/').pop()?.split(';')[0] || 'file',
                        quality: 'Original',
                        filesize: contentLength ? parseInt(contentLength) : null,
                        type: contentType.startsWith('video/') ? 'video' : (contentType.startsWith('audio/') ? 'audio' : 'file'),
                    }]
                });
            }
        } catch (e) {
            console.log("Head check failed, proceeding to youtube-dl", e);
        }

        // 2. Try specialized extraction with youtube-dl
        try {
            const rawOutput = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                noCallHome: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
            } as any);

            const output: any = rawOutput;

            // Filter relevant formats that have actual downloadable URLs
            const formats = output.formats
                ?.filter((f: any) => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'))
                .map((f: any) => ({
                    url: f.url,
                    ext: f.ext,
                    quality: f.format_note || f.resolution || (f.vcodec !== 'none' ? 'Video' : 'Audio'),
                    filesize: f.filesize,
                    type: f.vcodec !== 'none' ? 'video' : 'audio',
                }))
                .sort((a: any, b: any) => {
                    if (a.type === 'video' && b.type === 'audio') return -1;
                    if (a.type === 'audio' && b.type === 'video') return 1;
                    return (b.filesize || 0) - (a.filesize || 0);
                });

            const uniqueFormats: any[] = [];
            const seen = new Set();

            if (formats) {
                for (const f of formats) {
                    const key = `${f.quality}-${f.ext}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueFormats.push(f);
                    }
                }
            }

            return NextResponse.json({
                title: output.title,
                thumbnail: output.thumbnail,
                url: output.url || (uniqueFormats.length > 0 ? uniqueFormats[0].url : null),
                formats: uniqueFormats.slice(0, 8),
            });
        } catch (dlError) {
            // 3. Fallback for any other valid URL
            return NextResponse.json({
                title: "Generic Web Link",
                thumbnail: null,
                url: url,
                formats: [{
                    url: url,
                    ext: "link",
                    quality: "Direct Download",
                    type: "file"
                }]
            });
        }
    } catch (error: any) {
        console.error("Extraction error:", error.message || error);
        return NextResponse.json(
            { error: "Failed to process the link. Please ensure it's a valid URL." },
            { status: 500 }
        );
    }
}
