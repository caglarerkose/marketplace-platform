begin;

alter table public.seller_applications
  add column city text,
  add column district text,
  add column referral_code text;

create unique index seller_applications_open_tax_number_idx
  on public.seller_applications (tax_number)
  where tax_number is not null
    and status in ('draft', 'submitted', 'under_review', 'revision_requested');

comment on column public.seller_applications.referral_code is
  'Başvuru sırasında isteğe bağlı olarak girilen referans kodu.';

commit;
