export type VideoProvider = "youtube" | "vk";

export type VideoSource = {
  provider: VideoProvider;
  id: string;
  originalUrl: string;
};

export function extractVideoSource(url: string): VideoSource | null {
  return extractYouTubeVideoSource(url) ?? extractVkVideoSource(url);
}

export function isSupportedVideoUrl(url: string): boolean {
  return Boolean(extractVideoSource(url));
}

export function getVideoEmbedUrl(source: VideoSource): string {
  if (source.provider === "youtube") {
    return `https://www.youtube.com/embed/${source.id}`;
  }

  const [ownerId, videoId] = source.id.split("_");
  return `https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}`;
}

export function getDefaultThumbnailUrl(source: VideoSource): string | null {
  if (source.provider === "youtube") {
    return getYouTubeThumbnailUrl(source.id);
  }

  return null;
}

export function getVideoThumbnailProxyUrl(source: VideoSource): string | null {
  if (source.provider !== "vk") {
    return null;
  }

  const params = new URLSearchParams({
    url: source.originalUrl || getVideoEmbedUrl(source),
  });

  return `/api/video/thumbnail?${params.toString()}`;
}

export function extractYouTubeVideoId(url: string): string | null {
  return extractYouTubeVideoSource(url)?.id ?? null;
}

function extractYouTubeVideoSource(url: string): VideoSource | null {
  const value = url.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return { provider: "youtube", id: value, originalUrl: value };
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = normalizeYouTubeVideoId(parsed.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = normalizeYouTubeVideoId(parsed.searchParams.get("v"));
      }

      const [kind, pathVideoId] = parsed.pathname.split("/").filter(Boolean);
      if (kind === "embed" || kind === "shorts" || kind === "live") {
        const normalized = normalizeYouTubeVideoId(pathVideoId);
        return normalized
          ? { provider: "youtube", id: normalized, originalUrl: value }
          : null;
      }
    }

    return videoId ? { provider: "youtube", id: videoId, originalUrl: value } : null;
  } catch {
    return null;
  }
}

function normalizeYouTubeVideoId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const id = value.trim();
  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
}

export function extractVkVideoId(url: string): string | null {
  return extractVkVideoSource(url)?.id ?? null;
}

function extractVkVideoSource(url: string): VideoSource | null {
  const value = url.trim();

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (!["vk.com", "vk.ru", "vkvideo.ru"].includes(host)) {
      return null;
    }

    if (parsed.pathname === "/video_ext.php") {
      const ownerId = normalizeVkOwnerId(parsed.searchParams.get("oid"));
      const videoId = normalizeVkItemId(parsed.searchParams.get("id"));
      return ownerId && videoId
        ? { provider: "vk", id: `${ownerId}_${videoId}`, originalUrl: value }
        : null;
    }

    const candidates = [
      parsed.pathname,
      parsed.search,
      parsed.searchParams.get("z") ?? "",
      parsed.hash,
    ];

    for (const candidate of candidates) {
      const decoded = decodeURIComponent(candidate);
      const match = decoded.match(/(?:^|[/?&#])(?:video|clip)(-?\d+)_(\d+)/);
      if (match) {
        return {
          provider: "vk",
          id: `${match[1]}_${match[2]}`,
          originalUrl: value,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeVkOwnerId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const id = value.trim();
  return /^-?\d+$/.test(id) ? id : null;
}

function normalizeVkItemId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const id = value.trim();
  return /^\d+$/.test(id) ? id : null;
}

export function parseYouTubeDurationToSeconds(duration: string): number {
  const match = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );

  if (!match) {
    throw new Error(`Invalid YouTube duration: ${duration}`);
  }

  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  return (
    Number(days) * 24 * 60 * 60 +
    Number(hours) * 60 * 60 +
    Number(minutes) * 60 +
    Number(seconds)
  );
}

export function formatTimestamp(totalSeconds: number | null): string {
  if (totalSeconds === null) {
    return "";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function parseTimestampToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0) || parts.length > 3) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

export function getYouTubeThumbnailUrl(videoId: string, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
