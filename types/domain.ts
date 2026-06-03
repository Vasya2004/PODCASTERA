import type { NoteType, PodcastStatus } from "@/types/database";
import type { VideoProvider } from "@/lib/youtube/utils";

export type Tag = {
  id: string;
  name: string;
  color: string | null;
};

export type Podcast = {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  videoProvider: VideoProvider;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  description: string | null;
  status: PodcastStatus;
  personalRating: number | null;
  hashtag: string | null;
  watchedAt: string | null;
  mainTakeaway: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  notesCount: number;
};

export type Note = {
  id: string;
  podcastId: string;
  type: NoteType;
  content: string;
  timestampSeconds: number | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  podcast?: {
    id: string;
    title: string;
    channelTitle: string | null;
    youtubeVideoId: string;
    videoProvider: VideoProvider;
  };
};

export type DashboardStats = {
  watchedCount: number;
  watchedHours: number;
  favoriteNotesCount: number;
  insightsCount: number;
};
