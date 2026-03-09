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
    let filename = searchParams.get("filename") || "download";

    if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        console.log(`--- Proxying Download: ${url} ---`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers['content-type']?.split(';')[0]?.trim() || 'application/octet-stream';

        // Fix filename extension if missing or generic
        const currentExt = filename.split('.').pop()?.toLowerCase();
        const mappedExt = MIME_MAP[contentType];

        if (mappedExt && (!currentExt || currentExt === 'link' || currentExt === 'media' || currentExt === 'file')) {
            const baseName = filename.split('.')[0] || 'media';
            filename = `${baseName}.${mappedExt}`;
        }

        // Convert Node.js stream to Web Stream for Next.js Response
        const stream = new ReadableStream({
            start(controller) {
                response.data.on('data', (chunk: any) => controller.enqueue(chunk));
                response.data.on('end', () => controller.close());
                response.data.on('error', (err: any) => controller.error(err));
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Cache-Control': 'no-cache',
                'Content-Length': response.headers['content-length'] || '',
            },
        });
    } catch (error: any) {
        console.error("Proxy error:", error.message);
        return Response.redirect(url);
    }
}
