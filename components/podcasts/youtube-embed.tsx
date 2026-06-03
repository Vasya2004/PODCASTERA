import { getVideoEmbedUrl, type VideoProvider } from "@/lib/youtube/utils";

export function VideoEmbed({
  provider,
  videoId,
  videoUrl,
  title,
}: {
  provider: VideoProvider;
  videoId: string;
  videoUrl: string;
  title: string;
}) {
  const source = { provider, id: videoId, originalUrl: videoUrl };

  return (
    <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
      <iframe
        src={getVideoEmbedUrl(source)}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export const YouTubeEmbed = VideoEmbed;
