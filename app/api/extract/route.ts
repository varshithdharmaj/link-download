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
            console.log("Head check failed, proceeding to extractors");
        }

        // 2. Try Cobalt API for Social Media (Instagram, Twitter, TikTok, etc.)
        try {
            const cobaltResponse = await axios.post('https://api.cobalt.tools/api/json', {
                url: url,
                vQuality: 'max',
                filenamePattern: 'pretty',
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const data = cobaltResponse.data;

            if (data.status === 'stream' || data.status === 'picker' || data.status === 'redirect') {
                const formats = [];

                if (data.status === 'picker') {
                    for (const item of data.picker) {
                        formats.push({
                            url: item.url,
                            ext: item.type || 'media',
                            quality: item.quality || 'High',
                            type: item.type === 'photo' ? 'image' : 'video'
                        });
                    }
                } else {
                    formats.push({
                        url: data.url,
                        ext: data.filename?.split('.').pop() || 'media',
                        quality: 'Highest',
                        type: 'video'
                    });
                }

                return NextResponse.json({
                    title: data.filename || "Extracted Media",
                    thumbnail: null,
                    url: data.url,
                    formats: formats
                });
            }
        } catch (cobaltError: any) {
            console.log("Cobalt extraction failed, falling back to yt-dlp", cobaltError.message);
        }

        // 3. Try specialized extraction with youtube-dl
        try {
            const ytDlpOptions: any = {
                dumpSingleJson: true,
                noWarnings: true,
                noCallHome: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true,
            };

            // Inject Instagram Authentication Cookie if provided
            if (url.includes('instagram.com') && process.env.IG_SESSION_ID) {
                ytDlpOptions.addHeader = [
                    `Cookie: sessionid=${process.env.IG_SESSION_ID}`,
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                ];
                console.log("Using Authenticated IG Cookie Session");
            }

            const rawOutput = await youtubedl(url, ytDlpOptions);

            const output: any = rawOutput;

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
            // 4. If all methods fail, the link is likely unsupported, private, or requires login
            throw new Error("Could not extract media. The link might be unsupported, private (like an Instagram Story), or requires login.");
        }
    } catch (error: any) {
        console.error("Extraction error:", error.message || error);
        return NextResponse.json(
            { error: "Failed to process the link. Please ensure it's a valid URL." },
            { status: 500 }
        );
    }
}
