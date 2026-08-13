-- Turn viewing appointments into a privacy-safe sales lead inbox.
-- Public visitors may create a lead, while only authorised team members can read or manage it.
alter table public.viewing_appointments
  alter column preferred_at drop not null,
  alter column status set default 'new',
  add column if not exists lead_type text not null default 'viewing',
  add column if not exists source text not null default 'website',
  add column if not exists assigned_to uuid references public.profiles(id),
  add column if not exists internal_notes text not null default '',
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.viewing_appointments
  drop constraint if exists viewing_appointments_status_check,
  add constraint viewing_appointments_status_check
    check (status in ('new', 'contacted', 'scheduled', 'quoted', 'won', 'lost', 'pending', 'confirmed', 'completed', 'cancelled')),
  add constraint viewing_appointments_lead_type_check
    check (lead_type in ('viewing', 'finance', 'trade_in', 'general'));

create index if not exists viewing_appointments_status_created_at_idx
  on public.viewing_appointments (status, created_at desc);

drop policy if exists "public request viewing" on public.viewing_appointments;
create policy "public create sales lead"
on public.viewing_appointments
for insert
to anon, authenticated
with check (
  status = 'new'
  and lead_type in ('viewing', 'finance', 'trade_in', 'general')
  and char_length(btrim(customer_name)) between 1 and 100
  and char_length(btrim(phone)) between 6 and 40
  and (email is null or char_length(btrim(email)) <= 254)
  and (note is null or char_length(note) <= 2000)
);
