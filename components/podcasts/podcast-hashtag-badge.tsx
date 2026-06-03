import { cn } from "@/lib/utils/cn";

type PodcastHashtagBadgeProps = {
  hashtag: string | null;
  className?: string;
};

export function PodcastHashtagBadge({ hashtag, className }: PodcastHashtagBadgeProps) {
  if (!hashtag) {
    return null;
  }

  const displayValue = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;

  return (
    <span
      className={cn(
        "inline-flex max-w-[180px] items-center rounded-full bg-neutral-950/85 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur",
        className,
      )}
      title={displayValue}
    >
      <span className="truncate">{displayValue}</span>
    </span>
  );
}
