begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-documents', 'seller-documents', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.seller_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.seller_applications(id) on delete cascade,
  document_type text not null check (document_type in ('tax_certificate','signature_circular','iban_document','authorized_identity','activity_certificate','other')),
  file_path text not null unique,
  original_file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  status text not null default 'pending' check (status in ('pending','under_review','approved','missing','unreadable')),
  seller_note text,
  admin_note text,
  reviewed_by uuid references public.admin_users(user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_application_documents
  add column if not exists application_id uuid references public.seller_applications(id) on delete cascade,
  add column if not exists document_type text,
  add column if not exists file_path text,
  add column if not exists original_file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists status text default 'pending',
  add column if not exists seller_note text,
  add column if not exists admin_note text,
  add column if not exists reviewed_by uuid references public.admin_users(user_id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists seller_application_documents_application_idx
  on public.seller_application_documents(application_id, created_at desc);
create index if not exists seller_application_documents_review_idx
  on public.seller_application_documents(status, created_at);
create unique index if not exists seller_application_documents_file_path_idx
  on public.seller_application_documents(file_path)
  where file_path is not null;

drop trigger if exists seller_application_documents_set_updated_at on public.seller_application_documents;
create trigger seller_application_documents_set_updated_at
before update on public.seller_application_documents
for each row execute function public.set_updated_at();

alter table public.seller_application_documents enable row level security;
revoke all on table public.seller_application_documents from anon, authenticated;
grant select, insert, update, delete on table public.seller_application_documents to service_role;

drop policy if exists "seller_documents_service_only" on storage.objects;
create policy "seller_documents_service_only"
on storage.objects for all to service_role
using (bucket_id = 'seller-documents')
with check (bucket_id = 'seller-documents');

commit;
