-- Records changes already applied to live DB on 2026-10-18.
alter table public.store_apps alter column name drop not null;
update public.store_apps set title = name where title is null;
drop policy if exists "operators manage apps" on public.store_apps;
alter table public.store_apps drop constraint if exists store_apps_distribution_type_check;
alter table public.store_apps add constraint store_apps_distribution_type_check check (distribution_type = any (array['web_app_url','file','store_link','link','download','custom','access']));
alter table public.store_apps alter column distribution_type set default 'link';
