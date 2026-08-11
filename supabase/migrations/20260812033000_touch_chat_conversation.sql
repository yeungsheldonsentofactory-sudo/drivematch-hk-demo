-- Keep the support inbox ordered by its most recent customer or staff message.
create or replace function public.touch_chat_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function public.touch_chat_conversation() from public, anon, authenticated;

drop trigger if exists touch_chat_conversation_on_message on public.chat_messages;
create trigger touch_chat_conversation_on_message
after insert on public.chat_messages
for each row execute function public.touch_chat_conversation();
