-- Safely updates any custom or irregularly formatted types into strict 'IN' or 'OUT' format.
-- If you disabled the constraint and have "CASH IN" or "cache in" entries hiding in the field, this will rescue them.

UPDATE public.entries
SET type = 'IN'
WHERE type ILIKE '%in%' OR type ILIKE '%credit%' OR type = 'C' OR type = '+';

UPDATE public.entries
SET type = 'OUT'
WHERE type NOT IN ('IN', 'OUT');

-- Once fixed, if you want to ensure the constraint is properly active so it never happens again natively:
-- ALTER TABLE public.entries ADD CONSTRAINT entries_type_check CHECK (type IN ('IN', 'OUT'));
