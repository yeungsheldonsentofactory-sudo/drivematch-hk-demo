-- Cover foreign-key lookups used by the internal inboxes and vehicle galleries.
create index if not exists chat_conversations_visitor_id_idx on public.chat_conversations (visitor_id);
create index if not exists chat_messages_sender_id_idx on public.chat_messages (sender_id);
create index if not exists seller_submissions_reviewed_by_idx on public.seller_submissions (reviewed_by);
create index if not exists vehicle_images_vehicle_id_idx on public.vehicle_images (vehicle_id);
create index if not exists vehicles_created_by_idx on public.vehicles (created_by);
create index if not exists viewing_appointments_vehicle_id_idx on public.viewing_appointments (vehicle_id);
create index if not exists viewing_appointments_assigned_to_idx on public.viewing_appointments (assigned_to);
