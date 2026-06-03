import { NextResponse } from "next/server";
import { fetchVkEmbedThumbnailUrl } from "@/lib/youtube/metadata";
import { extractVideoSource } from "@/lib/youtube/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = extractVideoSource(searchParams.get("url") ?? "");

  if (!source || source.provider !== "vk") {
    return NextResponse.json(
      { ok: false, message: "VK Video URL is required." },
      { status: 400 },
    );
  }

  const thumbnailUrl = await fetchVkEmbedThumbnailUrl(source);
  if (!thumbnailUrl) {
    return NextResponse.json(
      { ok: false, message: "VK thumbnail was not found." },
      { status: 404 },
    );
  }

  const response = await fetch(thumbnailUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; PodcasteraBot/1.0; +https://podcastera-ten.vercel.app)",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.redirect(thumbnailUrl);
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": response.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
