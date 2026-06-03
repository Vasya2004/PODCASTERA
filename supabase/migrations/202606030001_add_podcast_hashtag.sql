alter table public.podcasts
add column hashtag text;

alter table public.podcasts
add constraint podcasts_hashtag_no_spaces_check
check (hashtag is null or hashtag !~ '\s');

drop index if exists podcasts_search_idx;

create index podcasts_search_idx on public.podcasts using gin (
  to_tsvector(
    'simple',
    coalesce(title, '') || ' ' ||
    coalesce(channel_title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(hashtag, '')
  )
);
