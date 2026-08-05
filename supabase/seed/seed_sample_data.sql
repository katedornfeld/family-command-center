-- Family Command Center — Sample Seed Data
--
-- Harmless, fictional-style demo records for local/dev testing of the four
-- MVP screens. No addresses, credentials, or other sensitive details.
--
-- Requires migrations 0001_create_core_schema.sql and
-- 0002_add_family_member_details.sql to have been run first.
--
-- Safe to re-run: each section deletes its own sample rows (matched by
-- name/title) before re-inserting, so running this twice does not create
-- duplicates.
--
-- Sample events use the week of Mon 2026-08-10 through Sun 2026-08-16 as a
-- concrete example week. Adjust the dates below if you want the sample
-- events to line up with "this week" whenever you run the script.

begin;

-- ---------------------------------------------------------------------------
-- family_members
-- ---------------------------------------------------------------------------
delete from family_members
where name in ('Kate Dornfeld', 'Jess Dornfeld', 'Madi Dornfeld', 'Theo Dornfeld', 'Hadley Dornfeld');

insert into family_members (name, role, birth_date, color) values
  ('Kate Dornfeld',   'Mother', '1990-07-12', '#E63946'),
  ('Jess Dornfeld',   'Mother', '1992-10-27', '#457B9D'),
  ('Madi Dornfeld',   'Child',  '2017-01-02', '#2A9D8F'),
  ('Theo Dornfeld',   'Child',  '2020-11-21', '#F4A261'),
  ('Hadley Dornfeld', 'Child',  '2022-06-01', '#E9C46A');

-- ---------------------------------------------------------------------------
-- events (sample week: Mon 2026-08-10 – Sun 2026-08-16)
-- ---------------------------------------------------------------------------
delete from events
where event_date between '2026-08-10' and '2026-08-16'
  and title in (
    'Theo - PT',
    'Madi - Piano',
    'Madi - Dance',
    'Madi - OT',
    'Theo & Hadley - Dance'
  );

insert into events (title, event_date, start_time, end_time, family_member_id, event_type, is_recurring)
select 'Theo - PT', '2026-08-10', '13:00', '14:00', id, 'appointment', true
from family_members where name = 'Theo Dornfeld'
union all
select 'Madi - Piano', '2026-08-10', '16:30', '17:00', id, 'activity', true
from family_members where name = 'Madi Dornfeld'
union all
select 'Madi - Dance', '2026-08-10', '18:45', '20:15', id, 'activity', true
from family_members where name = 'Madi Dornfeld'
union all
select 'Madi - Dance', '2026-08-12', '16:45', '20:15', id, 'activity', true
from family_members where name = 'Madi Dornfeld'
union all
select 'Madi - OT', '2026-08-13', '14:15', '15:15', id, 'appointment', true
from family_members where name = 'Madi Dornfeld'
union all
select 'Theo & Hadley - Dance', '2026-08-10', '16:30', '17:00', id, 'activity', true
from family_members where name = 'Theo Dornfeld'
union all
select 'Theo & Hadley - Dance', '2026-08-10', '16:30', '17:00', id, 'activity', true
from family_members where name = 'Hadley Dornfeld';

-- ---------------------------------------------------------------------------
-- grocery_items
-- ---------------------------------------------------------------------------
delete from grocery_items
where item_name in ('Milk', 'Eggs', 'Bananas', 'Chicken Breast', 'Bread', 'Paper Towels');

insert into grocery_items (item_name, category, quantity, purchased, notes) values
  ('Milk',            'dairy',     '1 gallon', false, null),
  ('Eggs',            'dairy',     '1 dozen',  false, null),
  ('Bananas',         'produce',   '6',        false, null),
  ('Chicken Breast',  'meat',      '2 lbs',    false, null),
  ('Bread',           'pantry',    '1 loaf',   false, 'Whole wheat'),
  ('Paper Towels',    'household', '1 pack',   true,  null);

-- ---------------------------------------------------------------------------
-- meal_plans (one approved sample meal for today)
-- ---------------------------------------------------------------------------
delete from meal_plans
where meal_name = 'Sheet Pan Chicken Fajitas'
  and plan_date = current_date;

insert into meal_plans (plan_date, meal_name, description, prep_note, source, status)
values (
  current_date,
  'Sheet Pan Chicken Fajitas',
  'Chicken, peppers, and onions roasted on one pan, served with tortillas.',
  'Slice peppers and onions ahead of time if mornings are tight.',
  'manual',
  'approved'
);

commit;
