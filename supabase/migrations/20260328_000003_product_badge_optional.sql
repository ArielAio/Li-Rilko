alter table public.products
alter column badge set default '';

update public.products
set badge = ''
where badge is distinct from '';
