"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RatingSelect } from "@/components/podcasts/rating-select";
import { TagInput } from "@/components/tags/tag-input";
import type { ActionResult } from "@/server/actions/result";
import type { Podcast } from "@/types/domain";

type MetadataState = {
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  durationSeconds: string;
  publishedAt: string;
};

type VideoMetadataPayload = {
  title?: string;
  channelTitle?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  publishedAt?: string | null;
};

type MetadataResponse =
  | { ok: true; metadata: VideoMetadataPayload }
  | { ok: false; message: string };

type PodcastFormProps = {
  podcast?: Podcast;
  action: (previousState: ActionResult, formData: FormData) => Promise<ActionResult>;
  mode?: "create" | "edit";
};

const initialState: ActionResult = { ok: true };

export function PodcastForm({
  podcast,
  action,
  mode = podcast ? "edit" : "create",
}: PodcastFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [metadata, setMetadata] = useState<MetadataState>({
    title: podcast?.title ?? "",
    channelTitle: podcast?.channelTitle ?? "",
    description: podcast?.description ?? "",
    thumbnailUrl: podcast?.thumbnailUrl ?? "",
    durationSeconds: podcast?.durationSeconds?.toString() ?? "",
    publishedAt: podcast?.publishedAt ? podcast.publishedAt.slice(0, 10) : "",
  });
  const [url, setUrl] = useState(podcast?.youtubeUrl ?? "");
  const [metadataPending, setMetadataPending] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null);

  async function loadMetadata() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setMetadataMessage("Вставьте ссылку на YouTube или VK Video.");
      return;
    }

    setMetadataPending(true);
    setMetadataMessage(null);

    try {
      const response = await fetch(
        `/api/video/metadata?url=${encodeURIComponent(trimmedUrl)}`,
      );
      const payload = (await response.json()) as MetadataResponse;

      if (!payload.ok) {
        setMetadataMessage(payload.message);
        return;
      }

      setMetadata((current) => ({
        title: payload.metadata.title ?? current.title,
        channelTitle: payload.metadata.channelTitle ?? current.channelTitle,
        description: payload.metadata.description ?? current.description,
        thumbnailUrl: payload.metadata.thumbnailUrl ?? current.thumbnailUrl,
        durationSeconds:
          payload.metadata.durationSeconds !== undefined &&
          payload.metadata.durationSeconds !== null
            ? String(payload.metadata.durationSeconds)
            : current.durationSeconds,
        publishedAt: payload.metadata.publishedAt
          ? payload.metadata.publishedAt.slice(0, 10)
          : current.publishedAt,
      }));
      setMetadataMessage("Метаданные загружены.");
    } catch (error) {
      setMetadataMessage(
        error instanceof Error ? error.message : "Не удалось загрузить метаданные.",
      );
    } finally {
      setMetadataPending(false);
    }
  }

  return (
    <Card className="rounded-xl p-3.5 sm:p-5">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="currentStatus" value={podcast?.status ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">Ссылка на видео</Label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              id="youtubeUrl"
              name="youtubeUrl"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=... или https://vk.com/video..."
              required
            />
            <Button
              type="button"
              variant="secondary"
              disabled={metadataPending}
              onClick={loadMetadata}
              className="h-11 sm:h-10"
            >
              {metadataPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Загрузить данные
            </Button>
          </div>
          {!state.ok && state.fieldErrors?.youtubeUrl ? (
            <p className="text-sm text-destructive">{state.fieldErrors.youtubeUrl[0]}</p>
          ) : null}
          {metadataMessage ? (
            <p className="text-sm text-muted-foreground">{metadataMessage}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {mode === "create" ? (
            <>
              <input type="hidden" name="description" value={metadata.description} />
              <input type="hidden" name="thumbnailUrl" value={metadata.thumbnailUrl} />
              <input type="hidden" name="durationSeconds" value={metadata.durationSeconds} />
              <input type="hidden" name="publishedAt" value={metadata.publishedAt} />
              <input type="hidden" name="summary" value="" />
            </>
          ) : (
            <>
              <input type="hidden" name="description" value={metadata.description} />
              <input type="hidden" name="thumbnailUrl" value={metadata.thumbnailUrl} />
              <input type="hidden" name="durationSeconds" value={metadata.durationSeconds} />
              <input type="hidden" name="publishedAt" value={metadata.publishedAt} />
              <input type="hidden" name="summary" value={podcast?.summary ?? ""} />
            </>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              name="title"
              value={metadata.title}
              onChange={(event) =>
                setMetadata((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channelTitle">Канал</Label>
            <Input
              id="channelTitle"
              name="channelTitle"
              value={metadata.channelTitle}
              onChange={(event) =>
                setMetadata((current) => ({
                  ...current,
                  channelTitle: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              id="status"
              name="status"
              defaultValue={podcast?.status ?? "want_to_watch"}
              className="h-11 sm:h-10"
            >
              <option value="want_to_watch">В планах</option>
              <option value="watching">Смотрю</option>
              <option value="watched">Просмотрен</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Рейтинг</Label>
            <RatingSelect defaultValue={podcast?.personalRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hashtag">Хештег на плашке</Label>
            <Input
              id="hashtag"
              name="hashtag"
              defaultValue={podcast?.hashtag ?? ""}
              placeholder="#podcast"
            />
            {!state.ok && state.fieldErrors?.hashtag ? (
              <p className="text-sm text-destructive">{state.fieldErrors.hashtag[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Теги</Label>
            <TagInput defaultTags={podcast?.tags} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mainTakeaway">Главный вывод</Label>
            <Textarea
              id="mainTakeaway"
              name="mainTakeaway"
              defaultValue={podcast?.mainTakeaway ?? ""}
              placeholder="Что главное забрать из выпуска?"
            />
          </div>
        </div>

        {!state.ok ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.message}
          </p>
        ) : state.message ? (
          <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="h-11 w-full sm:h-10 sm:w-auto">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {podcast ? "Сохранить изменения" : "Добавить подкаст"}
        </Button>
      </form>
    </Card>
  );
}
