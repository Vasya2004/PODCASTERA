"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractVideoSource, getDefaultThumbnailUrl } from "@/lib/youtube/utils";
import { parseTagList, podcastFormSchema } from "@/lib/validators/podcast";
import { requireUser } from "@/server/actions/auth-helpers";
import { failure, success, type ActionResult } from "@/server/actions/result";
import { syncPodcastTags } from "@/server/actions/tags";
import type { PodcastStatus } from "@/types/database";

function emptyToNull(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

type SchemaError = {
  code?: string;
  message?: string;
};

function isMissingHashtagColumn(error: SchemaError | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST204" ||
    (message.includes("hashtag") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  );
}

function withoutHashtag<T extends { hashtag?: unknown }>(payload: T) {
  const { hashtag, ...rest } = payload;
  void hashtag;
  return rest;
}

export async function createPodcast(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = podcastFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте поля формы.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const videoSource = extractVideoSource(parsed.data.youtubeUrl);
  if (!videoSource) {
    return failure("Поддерживаются ссылки на YouTube и VK Video.");
  }

  const { supabase, user } = await requireUser();
  const watchedAt =
    parsed.data.status === "watched" ? new Date().toISOString() : null;

  const podcastPayload = {
    user_id: user.id,
    youtube_url: parsed.data.youtubeUrl,
    youtube_video_id: videoSource.id,
    title: parsed.data.title,
    channel_title: emptyToNull(parsed.data.channelTitle),
    thumbnail_url:
      emptyToNull(parsed.data.thumbnailUrl) ?? getDefaultThumbnailUrl(videoSource),
    duration_seconds:
      parsed.data.durationSeconds === "" ? null : parsed.data.durationSeconds ?? null,
    published_at: emptyToNull(parsed.data.publishedAt),
    description: emptyToNull(parsed.data.description),
    status: parsed.data.status,
    personal_rating:
      parsed.data.personalRating === "" ? null : parsed.data.personalRating ?? null,
    hashtag: emptyToNull(parsed.data.hashtag),
    watched_at: watchedAt,
    main_takeaway: emptyToNull(parsed.data.mainTakeaway),
    summary: emptyToNull(parsed.data.summary),
  };

  let insertResult = await supabase
    .from("podcasts")
    .insert(podcastPayload)
    .select("id")
    .single();

  if (isMissingHashtagColumn(insertResult.error)) {
    insertResult = await supabase
      .from("podcasts")
      .insert(withoutHashtag(podcastPayload))
      .select("id")
      .single();
  }

  const { data, error } = insertResult;

  if (error) {
    if (error.code === "23505") {
      return failure("Этот подкаст уже есть в вашей библиотеке.");
    }
    return failure(error.message);
  }

  await syncPodcastTags(data.id, parseTagList(parsed.data.tags));
  revalidatePath("/podcasts");
  redirect(`/podcasts/${data.id}`);
}

export async function updatePodcast(
  podcastId: string,
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = podcastFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте поля формы.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const videoSource = extractVideoSource(parsed.data.youtubeUrl);
  if (!videoSource) {
    return failure("Поддерживаются ссылки на YouTube и VK Video.");
  }

  const { supabase, user } = await requireUser();
  const currentStatus = String(formData.get("currentStatus") ?? "");
  const watchedAt =
    parsed.data.status === "watched" && currentStatus !== "watched"
      ? new Date().toISOString()
      : parsed.data.status === "watched"
        ? undefined
        : null;

  const podcastPayload = {
    youtube_url: parsed.data.youtubeUrl,
    youtube_video_id: videoSource.id,
    title: parsed.data.title,
    channel_title: emptyToNull(parsed.data.channelTitle),
    thumbnail_url:
      emptyToNull(parsed.data.thumbnailUrl) ?? getDefaultThumbnailUrl(videoSource),
    duration_seconds:
      parsed.data.durationSeconds === "" ? null : parsed.data.durationSeconds ?? null,
    published_at: emptyToNull(parsed.data.publishedAt),
    description: emptyToNull(parsed.data.description),
    status: parsed.data.status,
    personal_rating:
      parsed.data.personalRating === "" ? null : parsed.data.personalRating ?? null,
    hashtag: emptyToNull(parsed.data.hashtag),
    watched_at: watchedAt,
    main_takeaway: emptyToNull(parsed.data.mainTakeaway),
    summary: emptyToNull(parsed.data.summary),
  };

  let updateResult = await supabase
    .from("podcasts")
    .update(podcastPayload)
    .eq("id", podcastId)
    .eq("user_id", user.id);

  if (isMissingHashtagColumn(updateResult.error)) {
    updateResult = await supabase
      .from("podcasts")
      .update(withoutHashtag(podcastPayload))
      .eq("id", podcastId)
      .eq("user_id", user.id);
  }

  const { error } = updateResult;

  if (error) {
    return failure(error.message);
  }

  await syncPodcastTags(podcastId, parseTagList(parsed.data.tags));
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath("/podcasts");
  return success("Подкаст обновлён");
}

export async function updatePodcastStatus(
  podcastId: string,
  status: PodcastStatus,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("podcasts")
    .update({
      status,
      watched_at: status === "watched" ? new Date().toISOString() : null,
    })
    .eq("id", podcastId)
    .eq("user_id", user.id);

  if (error) {
    return failure(error.message);
  }

  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath("/podcasts");
  return success("Статус обновлён");
}

export async function deletePodcast(podcastId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("podcasts")
    .delete()
    .eq("id", podcastId)
    .eq("user_id", user.id);

  if (error) {
    return failure(error.message);
  }

  revalidatePath("/podcasts");
  redirect("/podcasts");
}
