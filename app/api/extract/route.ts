import { NextResponse } from "next/server";
import youtubedl from "youtube-dl-exec";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                { error: "Please provide a valid URL" },
                { status: 400 }
            );
        }

        // Execute youtube-dl to dump JSON info
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
            // Sort by best quality video roughly
            .sort((a: any, b: any) => {
                if (a.type === 'video' && b.type === 'audio') return -1;
                if (a.type === 'audio' && b.type === 'video') return 1;
                return (b.filesize || 0) - (a.filesize || 0);
            });

        // Remove duplicates having the same quality and extension
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
            formats: uniqueFormats.slice(0, 8), // Provide top 8 options max to UI
        });
    } catch (error: any) {
        console.error("Extraction error:", error.message || error);
        return NextResponse.json(
            { error: "Failed to extract media. The link might be unsupported or private." },
            { status: 500 }
        );
    }
}
