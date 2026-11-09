-- Anonymous users can't read rows back under RLS, so saving results and
-- linking attempts to an account goes through narrow SECURITY DEFINER functions.

create or replace function public.update_test_attempt(
  p_id uuid,
  p_anonymous_id text,
  p_responses jsonb,
  p_analysis jsonb,
  p_word_count integer,
  p_score integer default null,
  p_display_name text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows integer;
begin
  update test_attempts
  set responses = p_responses,
      analysis = p_analysis,
      word_count = p_word_count,
      score = coalesce(p_score, score),
      display_name = coalesce(p_display_name, display_name),
      user_id = coalesce(user_id, v_uid)
  where id = p_id
    and (
      (v_uid is not null and user_id = v_uid)
      or (user_id is null and anonymous_id is not null and anonymous_id = p_anonymous_id)
    );
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'attempt not found or not owned by caller';
  end if;
end;
$$;

create or replace function public.claim_anon_attempts(p_anonymous_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rows integer;
begin
  if v_uid is null or p_anonymous_id is null or p_anonymous_id = '' then
    return 0;
  end if;
  update test_attempts
  set user_id = v_uid
  where anonymous_id = p_anonymous_id and user_id is null;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.update_test_attempt(uuid, text, jsonb, jsonb, integer, integer, text) from public;
revoke all on function public.claim_anon_attempts(text) from public;
grant execute on function public.update_test_attempt(uuid, text, jsonb, jsonb, integer, integer, text) to anon, authenticated;
grant execute on function public.claim_anon_attempts(text) to authenticated;
revoke execute on function public.claim_anon_attempts(text) from anon;
