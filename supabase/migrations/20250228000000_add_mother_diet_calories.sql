-- Add calories column to mother_diet for Gemini-estimated calorie tracking
alter table public.mother_diet
  add column if not exists calories int;

comment on column public.mother_diet.calories is 'Estimated calories for this entry (e.g. from Gemini API).';
