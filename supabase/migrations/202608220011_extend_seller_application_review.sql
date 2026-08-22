begin;

alter table public.seller_applications
  add column authorized_name text,
  add column sales_category text,
  add column iban text,
  add column preferred_shipping_company text,
  add column document_status text not null default 'pending'
    check (document_status in ('pending', 'under_review', 'complete', 'missing')),
  add column missing_field text,
  add column review_checklist jsonb not null default jsonb_build_object(
    'store_name_valid', false,
    'authorized_person_verified', false,
    'contact_verified', false,
    'company_verified', false,
    'documents_complete', false,
    'iban_verified', false
  ) check (jsonb_typeof(review_checklist) = 'object');

comment on column public.seller_applications.iban is
  'Satıcının başvuruda beyan ettiği IBAN; gerçek ödeme sağlayıcısı entegrasyonu değildir.';
comment on column public.seller_applications.preferred_shipping_company is
  'Satıcının başvuruda belirttiği tercih; gerçek kargo firması entegrasyonu değildir.';

commit;
