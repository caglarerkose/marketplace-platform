begin;
alter table public.store_showcase_settings
  add column if not exists layout_payload jsonb not null default '{"web":[{"key":"banner","width":100,"height":220},{"key":"promotion","width":100,"height":96},{"key":"products","width":100,"height":260}],"mobile":[{"key":"banner","width":100,"height":180},{"key":"promotion","width":100,"height":88},{"key":"products","width":100,"height":280}]}'::jsonb;
comment on column public.store_showcase_settings.layout_payload is 'Seller store page visual ordering and dimensions for web and mobile previews.';
commit;
