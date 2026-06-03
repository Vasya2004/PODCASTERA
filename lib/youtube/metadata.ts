import { parseYouTubeDurationToSeconds, type VideoSource } from "@/lib/youtube/utils";

export type VideoMetadata = {
  title: string;
  channelTitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
};

export type MetadataResult =
  | { ok: true; metadata: VideoMetadata }
  | { ok: false; message: string };

export type YouTubeVideoMetadata = VideoMetadata;

type YouTubeVideosResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function fetchYouTubeVideoMetadata(
  videoId: string,
): Promise<MetadataResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      message: "YOUTUBE_API_KEY is not configured. Fill metadata manually.",
    };
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      { next: { revalidate: 60 * 60 } },
    );

    const payload = (await response.json()) as YouTubeVideosResponse;

    if (!response.ok) {
      return {
        ok: false,
        message: payload.error?.message ?? "YouTube metadata request failed.",
      };
    }

    const item = payload.items?.[0];
    if (!item?.snippet) {
      return { ok: false, message: "Video was not found on YouTube." };
    }

    const duration = item.contentDetails?.duration;
    const thumbnails = item.snippet.thumbnails ?? {};

    return {
      ok: true,
      metadata: {
        title: item.snippet.title ?? "Untitled podcast",
        channelTitle: item.snippet.channelTitle ?? null,
        description: item.snippet.description ?? null,
        publishedAt: item.snippet.publishedAt ?? null,
        thumbnailUrl:
          thumbnails.maxres?.url ??
          thumbnails.standard?.url ??
          thumbnails.high?.url ??
          thumbnails.medium?.url ??
          thumbnails.default?.url ??
          null,
        durationSeconds: duration
          ? parseYouTubeDurationToSeconds(duration)
          : null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch YouTube metadata.",
    };
  }
}

type VkVideoResponse = {
  response?: {
    items?: VkVideoItem[];
  };
  error?: {
    error_msg?: string;
  };
};

type VkVideoItem = {
  title?: string;
  owner_id?: number;
  description?: string;
  duration?: number;
  date?: number;
  player?: string;
  image?: Array<{ url?: string; width?: number; height?: number }>;
  first_frame?: Array<{ url?: string; width?: number; height?: number }>;
  photo_1280?: string;
  photo_800?: string;
  photo_320?: string;
  photo_130?: string;
};

type OpenGraphMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
};

export async function fetchVideoMetadata(source: VideoSource): Promise<MetadataResult> {
  if (source.provider === "youtube") {
    return fetchYouTubeVideoMetadata(source.id);
  }

  return fetchVkVideoMetadata(source);
}

export async function fetchVkVideoMetadata(source: VideoSource): Promise<MetadataResult> {
  const apiResult = await fetchVkVideoMetadataFromApi(source);
  if (apiResult.ok) {
    return apiResult;
  }

  const pageResult = await fetchVkOpenGraphMetadata(source);
  if (pageResult.ok) {
    return pageResult;
  }

  return pageResult;
}

async function fetchVkVideoMetadataFromApi(source: VideoSource): Promise<MetadataResult> {
  const accessToken =
    process.env.VK_VIDEO_ACCESS_TOKEN ??
    process.env.VK_ACCESS_TOKEN ??
    process.env.VK_SERVICE_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      ok: false,
      message: "VK access token is not configured. Trying public page metadata.",
    };
  }

  const params = new URLSearchParams({
    videos: source.id,
    access_token: accessToken,
    v: "5.199",
  });

  try {
    const response = await fetch(
      `https://api.vk.com/method/video.get?${params.toString()}`,
      { next: { revalidate: 60 * 60 } },
    );
    const payload = (await response.json()) as VkVideoResponse;

    if (!response.ok || payload.error) {
      return {
        ok: false,
        message: payload.error?.error_msg ?? "VK metadata request failed.",
      };
    }

    const item = payload.response?.items?.[0];
    if (!item) {
      return { ok: false, message: "Video was not found on VK Video." };
    }

    return {
      ok: true,
      metadata: {
        title: item.title ?? "Untitled video",
        channelTitle: item.owner_id ? `VK ${item.owner_id}` : null,
        description: item.description ?? null,
        durationSeconds: item.duration ?? null,
        publishedAt: item.date ? new Date(item.date * 1000).toISOString() : null,
        thumbnailUrl: pickVkThumbnailUrl(item),
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch VK Video metadata.",
    };
  }
}

async function fetchVkOpenGraphMetadata(source: VideoSource): Promise<MetadataResult> {
  try {
    const response = await fetch(source.originalUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PodcasteraBot/1.0; +https://podcastera-ten.vercel.app)",
        accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `VK public page returned ${response.status}. Fill metadata manually.`,
      };
    }

    const html = await response.text();
    const metadata = extractOpenGraphMetadata(html);

    if (!metadata.title && !metadata.image) {
      return {
        ok: false,
        message: "VK public page metadata was not found. Fill metadata manually.",
      };
    }

    return {
      ok: true,
      metadata: {
        title: metadata.title ?? "VK Video",
        channelTitle: "VK Video",
        description: metadata.description,
        durationSeconds: null,
        publishedAt: null,
        thumbnailUrl: metadata.image,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch VK public page metadata.",
    };
  }
}

function pickVkThumbnailUrl(item: VkVideoItem) {
  const images = [...(item.image ?? []), ...(item.first_frame ?? [])]
    .filter((image) => image.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

  return (
    images[0]?.url ??
    item.photo_1280 ??
    item.photo_800 ??
    item.photo_320 ??
    item.photo_130 ??
    null
  );
}

function extractOpenGraphMetadata(html: string): OpenGraphMetadata {
  return {
    title:
      getMetaContent(html, "og:title") ??
      getMetaContent(html, "twitter:title") ??
      getTitleContent(html),
    description:
      getMetaContent(html, "og:description") ??
      getMetaContent(html, "description"),
    image:
      getMetaContent(html, "og:image") ??
      getMetaContent(html, "twitter:image") ??
      null,
  };
}

function getMetaContent(html: string, name: string): string | null {
  const escapedName = escapeRegExp(name);
  const pattern = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${escapedName}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escapedName}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function getTitleContent(html: string): string | null {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#62;/g, ">");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
