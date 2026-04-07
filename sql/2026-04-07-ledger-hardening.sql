begin;

alter table if exists public.projects
  add column if not exists archived_at timestamptz;

alter table if exists public.ledgers
  add column if not exists archived_at timestamptz,
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table if exists public.entries
  add column if not exists archived_at timestamptz;

alter table if exists public.entries
  add constraint entries_amount_presence_check
  check (
    ((coalesce(cash_in, 0) > 0)::int + (coalesce(cash_out, 0) > 0)::int) = 1
  );

alter table if exists public.entries
  add constraint entries_date_format_check
  check (date ~ '^\d{4}-\d{2}-\d{2}$');

alter table if exists public.entries
  add constraint entries_time_format_check
  check (time ~ '^\d{2}:\d{2}$');

create or replace function public.refresh_project_totals(target_project_id uuid)
returns void
language plpgsql
as $$
begin
  update public.projects p
  set
    total_in = coalesce(t.total_in, 0),
    total_out = coalesce(t.total_out, 0),
    balance = coalesce(t.total_in, 0) - coalesce(t.total_out, 0)
  from (
    select
      l.project_id,
      sum(coalesce(l.total_in, 0)) as total_in,
      sum(coalesce(l.total_out, 0)) as total_out
    from public.ledgers l
    where l.project_id = target_project_id
      and l.archived_at is null
    group by l.project_id
  ) t
  where p.id = target_project_id;

  update public.projects
  set total_in = 0, total_out = 0, balance = 0
  where id = target_project_id
    and not exists (
      select 1 from public.ledgers l
      where l.project_id = target_project_id
        and l.archived_at is null
    );
end;
$$;

create or replace function public.refresh_ledger_totals()
returns trigger
language plpgsql
as $$
declare
  target_ledger_id uuid;
  target_project_id uuid;
begin
  target_ledger_id := coalesce(new.ledger_id, old.ledger_id);

  update public.ledgers l
  set
    total_in = coalesce(t.total_in, 0),
    total_out = coalesce(t.total_out, 0),
    balance = coalesce(t.total_in, 0) - coalesce(t.total_out, 0)
  from (
    select
      e.ledger_id,
      sum(coalesce(e.cash_in, 0)) as total_in,
      sum(coalesce(e.cash_out, 0)) as total_out
    from public.entries e
    where e.ledger_id = target_ledger_id
      and e.archived_at is null
    group by e.ledger_id
  ) t
  where l.id = target_ledger_id;

  update public.ledgers
  set total_in = 0, total_out = 0, balance = 0
  where id = target_ledger_id
    and not exists (
      select 1 from public.entries e
      where e.ledger_id = target_ledger_id
        and e.archived_at is null
    );

  select project_id into target_project_id from public.ledgers where id = target_ledger_id;
  if target_project_id is not null then
    perform public.refresh_project_totals(target_project_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_ledger_totals on public.entries;
create trigger trg_refresh_ledger_totals
after insert or update or delete on public.entries
for each row execute function public.refresh_ledger_totals();

commit;
