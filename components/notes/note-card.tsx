"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Link2, MoreVertical, Pencil, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteNote, toggleFavoriteNote, updateNote } from "@/server/actions/notes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type { Note } from "@/types/domain";

type NoteCardMenuProps = {
  favorite: boolean;
  pending: boolean;
  showPodcast: boolean;
  podcastId?: string;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function NoteCardMenu({
  favorite,
  pending,
  showPodcast,
  podcastId,
  onToggleFavorite,
  onEdit,
  onDelete,
}: NoteCardMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Действия с заметкой"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-muted/70 text-muted-foreground transition hover:bg-muted hover:text-foreground",
          open && "bg-muted text-foreground",
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[188px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-muted/70"
            onClick={() => {
              setOpen(false);
              onToggleFavorite();
            }}
          >
            <Star className={cn("h-4 w-4", favorite && "fill-amber-500 text-amber-500")} />
            {favorite ? "Убрать из избранного" : "В избранное"}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-muted/70"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            Редактировать
          </button>
          {showPodcast && podcastId ? (
            <Link
              href={`/podcasts/${podcastId}`}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-muted/70"
              onClick={() => setOpen(false)}
            >
              <Link2 className="h-4 w-4" />
              Открыть подкаст
            </Link>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#a85d4a] transition hover:bg-destructive/5"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function NoteCard({
  note,
  showPodcast = false,
  compact = false,
}: {
  note: Note;
  showPodcast?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState(note.content);
  const [favorite, setFavorite] = useState(note.isFavorite);

  function run(result: Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const actionResult = await result;
      if (actionResult.ok) {
        toast.success(actionResult.message ?? "Готово");
        router.refresh();
      } else {
        toast.error(actionResult.message ?? "Ошибка");
      }
    });
  }

  return (
    <Card
      className={cn(
        "h-auto overflow-visible rounded-xl border-border/90 py-0 shadow-none",
        editing ? "p-3.5" : "px-3.5 py-2.5",
        favorite
          ? "border-2 border-[#c87941] bg-gradient-to-br from-[#fff1e3] via-[#fdebd2] to-card shadow-[0_2px_10px_-4px_rgba(200,121,65,0.45)]"
          : "bg-card",
      )}
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={compact ? 3 : 4} />
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="h-9 w-full sm:w-auto"
              onClick={() => setEditing(false)}
            >
              <X className="h-4 w-4" />
              Отмена
            </Button>
            <Button
              disabled={pending}
              className="h-9 w-full sm:w-auto"
              onClick={() => {
                run(updateNote(note.id, note.podcastId, note.type, content, "", ""));
                setEditing(false);
              }}
            >
              <Check className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <p
            className={cn(
              "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground",
              favorite && "font-medium",
            )}
          >
            {note.content}
          </p>
          <NoteCardMenu
            favorite={favorite}
            pending={pending}
            showPodcast={showPodcast}
            podcastId={note.podcast?.id}
            onToggleFavorite={() => {
              const next = !favorite;
              setFavorite(next);
              run(toggleFavoriteNote(note.id, note.podcastId, next));
            }}
            onEdit={() => setEditing(true)}
            onDelete={() => run(deleteNote(note.id, note.podcastId))}
          />
        </div>
      )}
    </Card>
  );
}
