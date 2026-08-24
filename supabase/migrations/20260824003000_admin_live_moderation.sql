begin;

-- ArcanaClash 1.0: authenticated presence, safe match spectating and audited bans.

create table if not exists private.arcana_live_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Arcano',
  state text not null default 'lobby' check (state in ('lobby', 'match', 'menu')),
  mode text,
  match_id text,
  snapshot jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists arcana_live_presence_updated_at_idx
  on private.arcana_live_presence(updated_at desc);

create table if not exists private.arcana_bans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  banned_by uuid not null references auth.users(id) on delete restrict,
  reason text not null check (char_length(reason) between 8 and 200),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null
);

create index if not exists arcana_bans_active_idx
  on private.arcana_bans(expires_at, revoked_at);

alter table private.arcana_live_presence enable row level security;
alter table private.arcana_live_presence force row level security;
alter table private.arcana_bans enable row level security;
alter table private.arcana_bans force row level security;

revoke all on private.arcana_live_presence from public, anon, authenticated;
revoke all on private.arcana_bans from public, anon, authenticated;

create or replace function private.arcana_active_ban(p_user_id uuid default auth.uid())
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reason', ban.reason,
    'expiresAt', ban.expires_at,
    'permanent', ban.expires_at is null,
    'createdAt', ban.created_at
  )
  from private.arcana_bans ban
  where ban.user_id = p_user_id
    and ban.revoked_at is null
    and (ban.expires_at is null or ban.expires_at > now())
  limit 1;
$$;

create or replace function public.arcana_presence_heartbeat(
  p_state text default 'lobby',
  p_mode text default null,
  p_match_id text default null,
  p_snapshot jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  active_ban jsonb;
  safe_name text;
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;

  active_ban := private.arcana_active_ban(caller);
  if active_ban is not null then
    delete from private.arcana_live_presence where user_id = caller;
    return jsonb_build_object('ok', false, 'code', 'banned', 'ban', active_ban);
  end if;

  if coalesce(p_state, '') not in ('lobby', 'match', 'menu')
    or char_length(coalesce(p_mode, '')) > 32
    or char_length(coalesce(p_match_id, '')) > 80
    or (p_snapshot is not null and (
      jsonb_typeof(p_snapshot) <> 'object'
      or octet_length(p_snapshot::text) > 65536
    )) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  select left(coalesce(
    nullif(trim(users.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(users.email, '@', 1), ''),
    'Arcano'
  ), 32)
  into safe_name
  from auth.users users
  where users.id = caller;

  insert into private.arcana_live_presence(
    user_id, display_name, state, mode, match_id, snapshot, updated_at
  ) values (
    caller,
    coalesce(safe_name, 'Arcano'),
    p_state,
    nullif(left(coalesce(p_mode, ''), 32), ''),
    nullif(left(coalesce(p_match_id, ''), 80), ''),
    case when p_state = 'match' then p_snapshot else null end,
    now()
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      state = excluded.state,
      mode = excluded.mode,
      match_id = excluded.match_id,
      snapshot = excluded.snapshot,
      updated_at = excluded.updated_at;

  delete from private.arcana_live_presence
  where updated_at < now() - interval '10 minutes';

  return jsonb_build_object('ok', true, 'serverTime', now());
end;
$$;

create or replace function public.arcana_presence_offline()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    return jsonb_build_object('ok', false, 'code', 'not_logged');
  end if;
  delete from private.arcana_live_presence where user_id = caller;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.arcana_admin_live_players()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
  entries jsonb;
begin
  if caller is null or not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;

  select coalesce(jsonb_agg(entry order by entry."updatedAt" desc), '[]'::jsonb)
  into entries
  from (
    select presence.user_id as "userId",
           presence.display_name as "displayName",
           presence.state,
           presence.mode,
           presence.match_id as "matchId",
           presence.updated_at as "updatedAt",
           private.arcana_active_ban(presence.user_id) is not null as "banned"
    from private.arcana_live_presence presence
    where presence.updated_at > now() - interval '45 seconds'
  ) entry;

  return jsonb_build_object('ok', true, 'entries', entries, 'serverTime', now());
end;
$$;

create or replace function public.arcana_admin_spectate(p_target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
  presence private.arcana_live_presence%rowtype;
begin
  if caller is null or not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;

  select * into presence
  from private.arcana_live_presence live
  where live.user_id = p_target_user_id
    and live.updated_at > now() - interval '45 seconds';

  if not found then
    return jsonb_build_object('ok', false, 'code', 'player_offline');
  end if;
  if presence.state <> 'match' or presence.snapshot is null then
    return jsonb_build_object('ok', false, 'code', 'not_in_match');
  end if;

  return jsonb_build_object(
    'ok', true,
    'player', jsonb_build_object(
      'userId', presence.user_id,
      'displayName', presence.display_name,
      'mode', presence.mode,
      'matchId', presence.match_id,
      'updatedAt', presence.updated_at
    ),
    'snapshot', presence.snapshot
  );
end;
$$;

create or replace function public.arcana_admin_ban_user(
  p_target_user_id uuid,
  p_reason text,
  p_duration_minutes integer default null
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
  next_expiry timestamptz;
begin
  if caller is null or not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;
  if p_target_user_id is null
    or p_target_user_id = caller
    or char_length(trim(coalesce(p_reason, ''))) not between 8 and 200
    or (p_duration_minutes is not null and p_duration_minutes not between 5 and 525600) then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;

  previous := private.arcana_active_ban(p_target_user_id);
  next_expiry := case
    when p_duration_minutes is null then null
    else now() + make_interval(mins => p_duration_minutes)
  end;

  insert into private.arcana_bans(
    user_id, banned_by, reason, expires_at, created_at, updated_at, revoked_at, revoked_by
  ) values (
    p_target_user_id, caller, trim(p_reason), next_expiry, now(), now(), null, null
  )
  on conflict (user_id) do update
  set banned_by = excluded.banned_by,
      reason = excluded.reason,
      expires_at = excluded.expires_at,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      revoked_at = null,
      revoked_by = null;

  insert into private.arcana_admin_audit(
    actor_user_id, target_user_id, action, reason, before_state, after_state
  ) values (
    caller,
    p_target_user_id,
    'user.ban',
    trim(p_reason),
    coalesce(previous, '{}'::jsonb),
    jsonb_build_object('expiresAt', next_expiry, 'permanent', next_expiry is null)
  );

  return jsonb_build_object(
    'ok', true,
    'targetUserId', p_target_user_id,
    'ban', jsonb_build_object('reason', trim(p_reason), 'expiresAt', next_expiry, 'permanent', next_expiry is null)
  );
end;
$$;

create or replace function public.arcana_admin_unban_user(
  p_target_user_id uuid,
  p_reason text default 'Banimento removido pelo administrador'
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
  if p_target_user_id is null
    or char_length(trim(coalesce(p_reason, ''))) not between 8 and 200 then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  previous := private.arcana_active_ban(p_target_user_id);
  update private.arcana_bans
  set revoked_at = now(), revoked_by = caller, updated_at = now()
  where user_id = p_target_user_id and revoked_at is null;

  insert into private.arcana_admin_audit(
    actor_user_id, target_user_id, action, reason, before_state, after_state
  ) values (
    caller,
    p_target_user_id,
    'user.unban',
    trim(p_reason),
    coalesce(previous, '{}'::jsonb),
    jsonb_build_object('revokedAt', now())
  );

  return jsonb_build_object('ok', true, 'targetUserId', p_target_user_id);
end;
$$;

create or replace function private.arcana_reject_banned_cloud_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() = new.user_id and private.arcana_active_ban(new.user_id) is not null then
    raise exception 'ARCANA_ACCOUNT_BANNED';
  end if;
  return new;
end;
$$;

drop trigger if exists arcana_reject_banned_cloud_write on public.arcana_cloud_saves;
create trigger arcana_reject_banned_cloud_write
before insert or update on public.arcana_cloud_saves
for each row execute function private.arcana_reject_banned_cloud_write();

revoke all on function private.arcana_active_ban(uuid) from public, anon, authenticated;
revoke all on function private.arcana_reject_banned_cloud_write() from public, anon, authenticated;
revoke execute on function public.arcana_presence_heartbeat(text, text, text, jsonb) from public, anon;
revoke execute on function public.arcana_presence_offline() from public, anon;
revoke execute on function public.arcana_admin_live_players() from public, anon;
revoke execute on function public.arcana_admin_spectate(uuid) from public, anon;
revoke execute on function public.arcana_admin_ban_user(uuid, text, integer) from public, anon;
revoke execute on function public.arcana_admin_unban_user(uuid, text) from public, anon;

grant execute on function public.arcana_presence_heartbeat(text, text, text, jsonb) to authenticated;
grant execute on function public.arcana_presence_offline() to authenticated;
grant execute on function public.arcana_admin_live_players() to authenticated;
grant execute on function public.arcana_admin_spectate(uuid) to authenticated;
grant execute on function public.arcana_admin_ban_user(uuid, text, integer) to authenticated;
grant execute on function public.arcana_admin_unban_user(uuid, text) to authenticated;

do $$
begin
  if has_table_privilege('authenticated', 'private.arcana_live_presence', 'select')
    or has_table_privilege('authenticated', 'private.arcana_bans', 'select') then
    raise exception 'ARCANA_SECURITY_ASSERTION_FAILED: private moderation tables exposed';
  end if;
  if has_function_privilege('anon', 'public.arcana_admin_live_players()', 'execute')
    or has_function_privilege('anon', 'public.arcana_admin_spectate(uuid)', 'execute')
    or has_function_privilege('anon', 'public.arcana_admin_ban_user(uuid,text,integer)', 'execute') then
    raise exception 'ARCANA_SECURITY_ASSERTION_FAILED: anonymous admin execution';
  end if;
end;
$$;

commit;
