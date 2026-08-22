begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.arcana_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('player', 'admin')),
  mfa_required boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

create table if not exists private.arcana_request_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  action text not null check (char_length(action) between 1 and 64),
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

create table if not exists private.arcana_admin_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 64),
  reason text not null check (char_length(reason) between 8 and 200),
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.arcana_cloud_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"profile":{},"strategy":{},"schema":2}'::jsonb,
  revision bigint not null default 0 check (revision between 0 and 9223372036854775806),
  integrity_state text not null default 'client_unverified' check (integrity_state in ('client_unverified', 'legacy_unverified')),
  updated_at timestamptz not null default now(),
  constraint arcana_cloud_saves_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint arcana_cloud_saves_payload_size check (octet_length(payload::text) <= 262144)
);

create table if not exists public.arcana_player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0 check (coins between 0 and 100000000),
  essence bigint not null default 0 check (essence between 0 and 100000000),
  ranked_points integer not null default 0 check (ranked_points between 0 and 1000000),
  season_xp bigint not null default 0 check (season_xp between 0 and 1000000000),
  matches bigint not null default 0 check (matches between 0 and 1000000000),
  wins bigint not null default 0 check (wins between 0 and matches),
  updated_at timestamptz not null default now()
);

create index if not exists arcana_cloud_saves_updated_at_idx on public.arcana_cloud_saves(updated_at);
create index if not exists arcana_admin_audit_created_at_idx on private.arcana_admin_audit(created_at desc);
create index if not exists arcana_request_log_created_at_idx on private.arcana_request_log(created_at);

alter table private.arcana_user_roles enable row level security;
alter table private.arcana_user_roles force row level security;
alter table private.arcana_request_log enable row level security;
alter table private.arcana_request_log force row level security;
alter table private.arcana_admin_audit enable row level security;
alter table private.arcana_admin_audit force row level security;
alter table public.arcana_cloud_saves enable row level security;
alter table public.arcana_cloud_saves force row level security;
alter table public.arcana_player_progress enable row level security;
alter table public.arcana_player_progress force row level security;

revoke all on private.arcana_user_roles from public, anon, authenticated;
revoke all on private.arcana_request_log from public, anon, authenticated;
revoke all on private.arcana_admin_audit from public, anon, authenticated;
revoke all on public.arcana_cloud_saves from public, anon, authenticated;
revoke all on public.arcana_player_progress from public, anon, authenticated;

drop policy if exists arcana_cloud_saves_owner_select on public.arcana_cloud_saves;
create policy arcana_cloud_saves_owner_select
  on public.arcana_cloud_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists arcana_player_progress_owner_select on public.arcana_player_progress;
create policy arcana_player_progress_owner_select
  on public.arcana_player_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.arcana_is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.arcana_user_roles roles
    where roles.user_id = p_user_id
      and roles.role = 'admin'
  );
$$;

create or replace function private.arcana_strip_sensitive(p_value jsonb)
returns jsonb
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
  item record;
begin
  if p_value is null then
    return 'null'::jsonb;
  end if;

  case jsonb_typeof(p_value)
    when 'object' then
      result := '{}'::jsonb;
      for item in select key, value from jsonb_each(p_value)
      loop
        if lower(item.key) not in (
          'password', 'passphrase', 'token', 'access_token', 'refresh_token',
          'authorization', 'apikey', 'api_key', 'secret', 'service_role',
          'email', 'phone', 'app_metadata', 'user_metadata', 'is_admin',
          'admin', 'roles'
        ) then
          result := result || jsonb_build_object(item.key, private.arcana_strip_sensitive(item.value));
        end if;
      end loop;
      return result;
    when 'array' then
      select coalesce(jsonb_agg(private.arcana_strip_sensitive(value)), '[]'::jsonb)
      into result
      from jsonb_array_elements(p_value);
      return result;
    else
      return p_value;
  end case;
end;
$$;

create or replace function private.arcana_canonical_save(p_payload jsonb)
returns jsonb
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  clean_profile jsonb;
  clean_strategy jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'ARCANA_INVALID_SAVE';
  end if;
  if jsonb_typeof(coalesce(p_payload->'profile', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_payload->'strategy', '{}'::jsonb)) <> 'object' then
    raise exception 'ARCANA_INVALID_SAVE';
  end if;

  clean_profile := private.arcana_strip_sensitive(coalesce(p_payload->'profile', '{}'::jsonb));
  clean_strategy := private.arcana_strip_sensitive(coalesce(p_payload->'strategy', '{}'::jsonb));

  return jsonb_build_object(
    'profile', clean_profile,
    'strategy', clean_strategy,
    'schema', 2
  );
end;
$$;

create or replace function public.arcana_load_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  save_row public.arcana_cloud_saves%rowtype;
  progress_row public.arcana_player_progress%rowtype;
  admin boolean;
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;

  insert into public.arcana_player_progress(user_id)
  values (caller)
  on conflict (user_id) do nothing;

  select * into save_row
  from public.arcana_cloud_saves
  where user_id = caller;

  select * into progress_row
  from public.arcana_player_progress
  where user_id = caller;

  admin := private.arcana_is_admin(caller);

  return jsonb_build_object(
    'ok', true,
    'save', case when save_row.user_id is null then null else save_row.payload end,
    'revision', coalesce(save_row.revision, 0),
    'updatedAt', save_row.updated_at,
    'integrity', coalesce(save_row.integrity_state, 'client_unverified'),
    'trusted', jsonb_build_object(
      'coins', progress_row.coins,
      'essence', progress_row.essence,
      'rankedPoints', progress_row.ranked_points,
      'seasonXp', progress_row.season_xp,
      'matches', progress_row.matches,
      'wins', progress_row.wins,
      'updatedAt', progress_row.updated_at
    ),
    'security', jsonb_build_object(
      'role', case when admin then 'admin' else 'player' end,
      'aal', assurance,
      'adminReady', admin and assurance = 'aal2',
      'cloudAuthority', 'rls_rpc_v2'
    )
  );
end;
$$;

create or replace function public.arcana_save_cloud(
  p_payload jsonb,
  p_base_revision bigint default 0,
  p_request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  canonical jsonb;
  current_revision bigint;
  current_updated_at timestamptz;
  response jsonb;
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;
  if p_request_id is null then
    raise exception 'ARCANA_INVALID_REQUEST_ID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));

  select request.response into response
  from private.arcana_request_log request
  where request.user_id = caller
    and request.request_id = p_request_id;
  if found then
    return response;
  end if;

  canonical := private.arcana_canonical_save(p_payload);
  if octet_length(canonical::text) > 262144 then
    raise exception 'ARCANA_SAVE_TOO_LARGE';
  end if;

  select saves.revision, saves.updated_at
  into current_revision, current_updated_at
  from public.arcana_cloud_saves saves
  where saves.user_id = caller
  for update;

  if found then
    if current_revision <> greatest(0, coalesce(p_base_revision, 0)) then
      response := jsonb_build_object(
        'ok', false,
        'code', 'revision_conflict',
        'revision', current_revision
      );
    elsif current_updated_at > now() - interval '2 seconds' then
      response := jsonb_build_object(
        'ok', false,
        'code', 'rate_limited',
        'retryAfterMs', 2000
      );
    else
      update public.arcana_cloud_saves
      set payload = canonical,
          revision = revision + 1,
          integrity_state = 'client_unverified',
          updated_at = now()
      where user_id = caller
      returning jsonb_build_object(
        'ok', true,
        'revision', revision,
        'updatedAt', updated_at,
        'integrity', integrity_state
      ) into response;
    end if;
  elsif greatest(0, coalesce(p_base_revision, 0)) <> 0 then
    response := jsonb_build_object('ok', false, 'code', 'revision_conflict', 'revision', 0);
  else
    insert into public.arcana_cloud_saves(user_id, payload, revision, integrity_state)
    values (caller, canonical, 1, 'client_unverified')
    returning jsonb_build_object(
      'ok', true,
      'revision', revision,
      'updatedAt', updated_at,
      'integrity', integrity_state
    ) into response;
  end if;

  if coalesce((response->>'ok')::boolean, false) then
    insert into private.arcana_request_log(user_id, request_id, action, response)
    values (caller, p_request_id, 'cloud.save', response)
    on conflict (user_id, request_id) do nothing;
  end if;

  delete from private.arcana_request_log
  where user_id = caller
    and created_at < now() - interval '10 minutes';

  return response;
end;
$$;

create or replace function public.arcana_migrate_legacy_save()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  legacy jsonb;
  canonical jsonb;
  legacy_revision bigint;
  account jsonb;
  migrated boolean := false;
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;

  select users.raw_user_meta_data->'arcana_save'
  into legacy
  from auth.users users
  where users.id = caller
  for update;

  if legacy is not null and jsonb_typeof(legacy) = 'object' and octet_length(legacy::text) <= 262144 then
    canonical := private.arcana_canonical_save(legacy);
    legacy_revision := case
      when coalesce(legacy->>'revision', '') ~ '^[0-9]{1,18}$'
        then greatest(1, least((legacy->>'revision')::bigint, 9223372036854775806))
      else 1
    end;

    insert into public.arcana_cloud_saves(user_id, payload, revision, integrity_state)
    values (caller, canonical, legacy_revision, 'legacy_unverified')
    on conflict (user_id) do nothing;
    migrated := found;

    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'arcana_save'
    where id = caller;
  end if;

  account := public.arcana_load_account();
  return account || jsonb_build_object('legacyMigrated', migrated);
end;
$$;

create or replace function public.arcana_admin_adjust_progress(
  p_target_user_id uuid,
  p_coins_delta integer,
  p_essence_delta integer,
  p_reason text,
  p_request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
  before_row public.arcana_player_progress%rowtype;
  after_row public.arcana_player_progress%rowtype;
  response jsonb;
begin
  if caller is null then
    raise exception 'ARCANA_AUTH_REQUIRED';
  end if;
  if p_request_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  if not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;
  if p_target_user_id is null
    or abs(coalesce(p_coins_delta, 0)) > 100000
    or abs(coalesce(p_essence_delta, 0)) > 100000
    or (coalesce(p_coins_delta, 0) = 0 and coalesce(p_essence_delta, 0) = 0)
    or char_length(trim(coalesce(p_reason, ''))) not between 8 and 200 then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    return jsonb_build_object('ok', false, 'code', 'user_not_found');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller::text, 0));

  select request.response into response
  from private.arcana_request_log request
  where request.user_id = caller
    and request.request_id = p_request_id;
  if found then
    return response;
  end if;

  insert into public.arcana_player_progress(user_id)
  values (p_target_user_id)
  on conflict (user_id) do nothing;

  select * into before_row
  from public.arcana_player_progress
  where user_id = p_target_user_id
  for update;

  update public.arcana_player_progress
  set coins = greatest(0, least(100000000, coins + coalesce(p_coins_delta, 0))),
      essence = greatest(0, least(100000000, essence + coalesce(p_essence_delta, 0))),
      updated_at = now()
  where user_id = p_target_user_id
  returning * into after_row;

  insert into private.arcana_admin_audit(
    actor_user_id, target_user_id, action, reason, before_state, after_state
  ) values (
    caller,
    p_target_user_id,
    'progress.adjust',
    trim(p_reason),
    jsonb_build_object('coins', before_row.coins, 'essence', before_row.essence),
    jsonb_build_object('coins', after_row.coins, 'essence', after_row.essence)
  );

  response := jsonb_build_object(
    'ok', true,
    'targetUserId', p_target_user_id,
    'trusted', jsonb_build_object(
      'coins', after_row.coins,
      'essence', after_row.essence,
      'rankedPoints', after_row.ranked_points,
      'seasonXp', after_row.season_xp,
      'matches', after_row.matches,
      'wins', after_row.wins,
      'updatedAt', after_row.updated_at
    )
  );

  insert into private.arcana_request_log(user_id, request_id, action, response)
  values (caller, p_request_id, 'admin.progress.adjust', response)
  on conflict (user_id, request_id) do nothing;

  delete from private.arcana_request_log
  where user_id = caller
    and created_at < now() - interval '10 minutes';

  return response;
end;
$$;

create or replace function public.arcana_admin_recent_audit(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  assurance text := coalesce(auth.jwt()->>'aal', 'aal1');
  result jsonb;
begin
  if caller is null or not private.arcana_is_admin(caller) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if assurance <> 'aal2' then
    return jsonb_build_object('ok', false, 'code', 'mfa_required');
  end if;

  select coalesce(jsonb_agg(entry order by entry."createdAt" desc), '[]'::jsonb)
  into result
  from (
    select audit.id,
           audit.actor_user_id as "actorUserId",
           audit.target_user_id as "targetUserId",
           audit.action,
           audit.reason,
           audit.before_state as "before",
           audit.after_state as "after",
           audit.created_at as "createdAt"
    from private.arcana_admin_audit audit
    order by audit.created_at desc
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  ) entry;

  return jsonb_build_object('ok', true, 'entries', result);
end;
$$;

create or replace function private.arcana_promote_admin_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select users.id into target
  from auth.users users
  where lower(users.email) = lower(trim(p_email))
  limit 1;

  if target is null then
    raise exception 'ARCANA_USER_NOT_FOUND';
  end if;

  insert into private.arcana_user_roles(user_id, role, mfa_required, granted_by)
  values (target, 'admin', true, null)
  on conflict (user_id) do update
  set role = 'admin',
      mfa_required = true,
      granted_by = null,
      granted_at = now();

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin', 'is_admin', true)
  where id = target;

  insert into private.arcana_admin_audit(
    actor_user_id, target_user_id, action, reason, before_state, after_state
  ) values (
    null,
    target,
    'role.promote',
    'Bootstrap seguro pelo SQL Editor',
    '{}'::jsonb,
    jsonb_build_object('role', 'admin', 'mfaRequired', true)
  );

  return target;
end;
$$;

create or replace function private.arcana_on_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.arcana_player_progress(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists arcana_auth_user_created on auth.users;
create trigger arcana_auth_user_created
  after insert on auth.users
  for each row execute function private.arcana_on_user_created();

revoke execute on function private.arcana_is_admin(uuid) from public, anon, authenticated;
revoke execute on function private.arcana_strip_sensitive(jsonb) from public, anon, authenticated;
revoke execute on function private.arcana_canonical_save(jsonb) from public, anon, authenticated;
revoke execute on function private.arcana_promote_admin_by_email(text) from public, anon, authenticated;
revoke execute on function private.arcana_on_user_created() from public, anon, authenticated;

revoke execute on function public.arcana_load_account() from public, anon;
revoke execute on function public.arcana_save_cloud(jsonb, bigint, uuid) from public, anon;
revoke execute on function public.arcana_migrate_legacy_save() from public, anon;
revoke execute on function public.arcana_admin_adjust_progress(uuid, integer, integer, text, uuid) from public, anon;
revoke execute on function public.arcana_admin_recent_audit(integer) from public, anon;

grant execute on function public.arcana_load_account() to authenticated;
grant execute on function public.arcana_save_cloud(jsonb, bigint, uuid) to authenticated;
grant execute on function public.arcana_migrate_legacy_save() to authenticated;
grant execute on function public.arcana_admin_adjust_progress(uuid, integer, integer, text, uuid) to authenticated;
grant execute on function public.arcana_admin_recent_audit(integer) to authenticated;

do $$
declare
  save_rls boolean;
  save_forced boolean;
  progress_rls boolean;
  progress_forced boolean;
begin
  select relrowsecurity, relforcerowsecurity
  into save_rls, save_forced
  from pg_catalog.pg_class
  where oid = 'public.arcana_cloud_saves'::regclass;

  select relrowsecurity, relforcerowsecurity
  into progress_rls, progress_forced
  from pg_catalog.pg_class
  where oid = 'public.arcana_player_progress'::regclass;

  if not save_rls or not save_forced or not progress_rls or not progress_forced then
    raise exception 'ARCANA_SECURITY_CHECK_RLS_FAILED';
  end if;
  if has_schema_privilege('authenticated', 'private', 'usage') then
    raise exception 'ARCANA_SECURITY_CHECK_PRIVATE_SCHEMA_FAILED';
  end if;
  if has_table_privilege('authenticated', 'public.arcana_cloud_saves', 'insert,update,delete')
    or has_table_privilege('authenticated', 'public.arcana_player_progress', 'insert,update,delete') then
    raise exception 'ARCANA_SECURITY_CHECK_TABLE_GRANTS_FAILED';
  end if;
  if has_function_privilege('anon', 'public.arcana_save_cloud(jsonb,bigint,uuid)', 'execute')
    or has_function_privilege('anon', 'public.arcana_admin_adjust_progress(uuid,integer,integer,text,uuid)', 'execute') then
    raise exception 'ARCANA_SECURITY_CHECK_ANON_RPC_FAILED';
  end if;
  if not has_function_privilege('authenticated', 'public.arcana_load_account()', 'execute')
    or not has_function_privilege('authenticated', 'public.arcana_save_cloud(jsonb,bigint,uuid)', 'execute') then
    raise exception 'ARCANA_SECURITY_CHECK_AUTH_RPC_FAILED';
  end if;
end;
$$;

commit;
