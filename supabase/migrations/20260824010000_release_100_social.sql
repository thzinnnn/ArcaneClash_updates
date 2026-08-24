begin;

create table if not exists private.arcana_friendships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists arcana_friendships_addressee_idx
  on private.arcana_friendships(addressee_id, status);

create table if not exists private.arcana_live_events (
  slot text primary key check (slot = 'current'),
  event_id text not null check (char_length(event_id) between 1 and 40),
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) between 8 and 300),
  icon text not null default '✦' check (char_length(icon) between 1 and 16),
  rules jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(rules) = 'object'),
  check (ends_at > starts_at)
);

alter table private.arcana_friendships enable row level security;
alter table private.arcana_friendships force row level security;
alter table private.arcana_live_events enable row level security;
alter table private.arcana_live_events force row level security;

revoke all on private.arcana_friendships from public, anon, authenticated;
revoke all on private.arcana_live_events from public, anon, authenticated;

create or replace function public.arcana_friend_request(p_target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;
  if p_target_user_id is null or p_target_user_id = caller then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  if private.arcana_active_ban(caller) is not null then
    return jsonb_build_object('ok', false, 'code', 'banned');
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;
  if exists (
    select 1 from private.arcana_friendships friendship
    where friendship.requester_id = p_target_user_id
      and friendship.addressee_id = caller
      and friendship.status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'code', 'incoming_pending');
  end if;
  if exists (
    select 1 from private.arcana_friendships friendship
    where ((friendship.requester_id = caller and friendship.addressee_id = p_target_user_id)
       or (friendship.requester_id = p_target_user_id and friendship.addressee_id = caller))
      and friendship.status = 'accepted'
  ) then
    return jsonb_build_object('ok', true, 'status', 'accepted');
  end if;

  insert into private.arcana_friendships(requester_id, addressee_id, status)
  values (caller, p_target_user_id, 'pending')
  on conflict (requester_id, addressee_id) do update
    set status = 'pending', created_at = now(), accepted_at = null;

  return jsonb_build_object('ok', true, 'status', 'pending');
end;
$$;

create or replace function public.arcana_friend_accept(p_requester_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;
  if private.arcana_active_ban(caller) is not null then
    return jsonb_build_object('ok', false, 'code', 'banned');
  end if;

  update private.arcana_friendships
  set status = 'accepted', accepted_at = now()
  where requester_id = p_requester_user_id
    and addressee_id = caller
    and status = 'pending';

  if not found then
    return jsonb_build_object('ok', false, 'code', 'request_not_found');
  end if;
  return jsonb_build_object('ok', true, 'status', 'accepted');
end;
$$;

create or replace function public.arcana_friend_remove(p_other_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;
  delete from private.arcana_friendships friendship
  where (friendship.requester_id = caller and friendship.addressee_id = p_other_user_id)
     or (friendship.requester_id = p_other_user_id and friendship.addressee_id = caller);
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.arcana_friend_list()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  entries jsonb;
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;

  select coalesce(jsonb_agg(entry order by entry."status" desc, entry."displayName"), '[]'::jsonb)
  into entries
  from (
    select other.id as "userId",
           left(coalesce(nullif(trim(other.raw_user_meta_data->>'display_name'), ''), 'Arcano'), 32) as "displayName",
           friendship.status,
           case when friendship.status = 'pending' and friendship.addressee_id = caller then 'incoming'
                when friendship.status = 'pending' then 'outgoing'
                else 'friend' end as direction,
           presence.updated_at > now() - interval '45 seconds' as "online",
           case when presence.updated_at > now() - interval '45 seconds' then presence.state else null end as "presenceState",
           case when presence.updated_at > now() - interval '45 seconds' then presence.mode else null end as mode
    from private.arcana_friendships friendship
    join auth.users other
      on other.id = case when friendship.requester_id = caller then friendship.addressee_id else friendship.requester_id end
    left join private.arcana_live_presence presence on presence.user_id = other.id
    where friendship.requester_id = caller or friendship.addressee_id = caller
  ) entry;

  return jsonb_build_object('ok', true, 'entries', entries);
end;
$$;

create or replace function public.arcana_current_event()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row private.arcana_live_events%rowtype;
begin
  select * into event_row
  from private.arcana_live_events event
  where event.slot = 'current'
    and event.active
    and now() between event.starts_at and event.ends_at;

  if not found then
    return jsonb_build_object('ok', true, 'event', null);
  end if;
  return jsonb_build_object('ok', true, 'event', jsonb_build_object(
    'id', event_row.event_id,
    'title', event_row.title,
    'description', event_row.description,
    'icon', event_row.icon,
    'rules', event_row.rules,
    'startsAt', event_row.starts_at,
    'endsAt', event_row.ends_at
  ));
end;
$$;

create or replace function public.arcana_admin_set_event(
  p_event_id text,
  p_title text,
  p_description text,
  p_icon text,
  p_rules jsonb,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
  previous jsonb;
begin
  if caller is null or not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;
  if char_length(trim(coalesce(p_event_id, ''))) not between 1 and 40
    or char_length(trim(coalesce(p_title, ''))) not between 1 and 80
    or char_length(trim(coalesce(p_description, ''))) not between 8 and 300
    or char_length(coalesce(p_icon, '')) not between 1 and 16
    or p_rules is null or jsonb_typeof(p_rules) <> 'object'
    or p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at
    or char_length(trim(coalesce(p_reason, ''))) not between 8 and 200 then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select to_jsonb(event) into previous
  from private.arcana_live_events event where event.slot = 'current';

  insert into private.arcana_live_events(
    slot, event_id, title, description, icon, rules, starts_at, ends_at, active, updated_by, updated_at
  ) values (
    'current', trim(p_event_id), trim(p_title), trim(p_description), p_icon, p_rules,
    p_starts_at, p_ends_at, true, caller, now()
  )
  on conflict (slot) do update set
    event_id = excluded.event_id,
    title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    rules = excluded.rules,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    active = true,
    updated_by = caller,
    updated_at = now();

  insert into private.arcana_admin_audit(
    actor_user_id, target_user_id, action, reason, before_state, after_state
  ) values (
    caller, null, 'event.set', trim(p_reason), coalesce(previous, '{}'::jsonb),
    jsonb_build_object('eventId', trim(p_event_id), 'title', trim(p_title), 'startsAt', p_starts_at, 'endsAt', p_ends_at)
  );

  return jsonb_build_object('ok', true, 'eventId', trim(p_event_id));
end;
$$;

revoke execute on function public.arcana_friend_request(uuid) from public, anon;
revoke execute on function public.arcana_friend_accept(uuid) from public, anon;
revoke execute on function public.arcana_friend_remove(uuid) from public, anon;
revoke execute on function public.arcana_friend_list() from public, anon;
revoke execute on function public.arcana_current_event() from public, anon;
revoke execute on function public.arcana_admin_set_event(text, text, text, text, jsonb, timestamptz, timestamptz, text) from public, anon;

grant execute on function public.arcana_friend_request(uuid) to authenticated;
grant execute on function public.arcana_friend_accept(uuid) to authenticated;
grant execute on function public.arcana_friend_remove(uuid) to authenticated;
grant execute on function public.arcana_friend_list() to authenticated;
grant execute on function public.arcana_current_event() to authenticated;
grant execute on function public.arcana_admin_set_event(text, text, text, text, jsonb, timestamptz, timestamptz, text) to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'private.arcana_friendships', 'select')
    or has_table_privilege('authenticated', 'private.arcana_live_events', 'select') then
    raise exception 'ARCANA_SECURITY_ASSERTION_FAILED: private social tables exposed';
  end if;
  if has_function_privilege('anon', 'public.arcana_friend_list()', 'execute')
    or has_function_privilege('anon', 'public.arcana_admin_set_event(text,text,text,text,jsonb,timestamptz,timestamptz,text)', 'execute') then
    raise exception 'ARCANA_SECURITY_ASSERTION_FAILED: anonymous social/admin execution';
  end if;
end;
$$;

commit;
