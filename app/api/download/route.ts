import { NextResponse } from "next/server";
import axios from "axios";

const MIME_MAP: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const mode = searchParams.get("mode") || "download"; // 'preview' (inline) or 'download' (attachment)
    let filename = searchParams.get("filename") || "media";

    if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        console.log(`--- Proxying Mode: ${mode}, URL: ${url} ---`);

        const range = req.headers.get("range");
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        };

        if (range) {
            headers['Range'] = range;
        }

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 60000,
            headers: headers,
            validateStatus: (status) => status >= 200 && status < 300 || status === 206
        });

        const contentType = response.headers['content-type']?.split(';')[0]?.trim() || 'application/octet-stream';

        // Fix filename extension if missing or generic
        const currentExt = filename.split('.').pop()?.toLowerCase();
        const mappedExt = MIME_MAP[contentType];

        if (mappedExt && (!currentExt || ['link', 'media', 'file'].includes(currentExt))) {
            const baseName = filename.split('.')[0] || 'media';
            filename = `${baseName}.${mappedExt}`;
        }

        const contentDisposition = mode === 'preview' 
            ? 'inline' 
            : `attachment; filename="${encodeURIComponent(filename)}"`;

        // Create Web Stream from Node.js stream
        const stream = new ReadableStream({
            start(controller) {
                response.data.on('data', (chunk: any) => controller.enqueue(chunk));
                response.data.on('end', () => controller.close());
                response.data.on('error', (err: any) => controller.error(err));
            },
            cancel() {
                // Important for range requests/seeking: abort the axios request if stream is cancelled
                if (response.data.destroy) response.data.destroy();
            }
        });

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', contentType);
        responseHeaders.set('Content-Disposition', contentDisposition);
        responseHeaders.set('Cache-Control', 'public, max-age=3600');
        
        // Pass through important headers from original response
        const headersToPass = ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
        headersToPass.forEach(h => {
            if (response.headers[h]) {
                responseHeaders.set(h, response.headers[h]);
            }
        });

        return new Response(stream, { 
            status: response.status,
            headers: responseHeaders 
        });
    } catch (error: any) {
        console.error("Proxy error:", error.message);
        // If it's a 416 Range Not Satisfiable, we should return that
        if (error.response?.status === 416) {
            return new Response(null, { status: 416 });
        }
        return NextResponse.json({ error: "Failed to fetch media from source" }, { status: 502 });
    }
}
