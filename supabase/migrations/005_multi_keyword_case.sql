-- 005: hapus regex, tambah multi-keyword (via pattern comma) + case-sensitive
-- Pattern sekarang menyimpan multi keyword dipisah koma, contoh "harga, price, biaya"

-- 1) Tambah kolom case-sensitive
ALTER TABLE public.device_automations ADD COLUMN IF NOT EXISTS is_case_sensitive BOOLEAN NOT NULL DEFAULT false;

-- 2) Drop constraint lama dulu
ALTER TABLE public.device_automations DROP CONSTRAINT IF EXISTS device_automations_trigger_category_check;
ALTER TABLE public.device_automations DROP CONSTRAINT IF EXISTS device_automations_trigger_type_check;

-- 3) Migrasi data lama regex -> contains (keyword) SEBELUM add constraint baru (biar tidak violate)
UPDATE public.device_automations SET trigger_category = 'contains' WHERE trigger_category = 'regex';
UPDATE public.device_automations SET trigger_type = 'keyword' WHERE trigger_type = 'regex';
-- fallback: handle null/case lain
UPDATE public.device_automations SET trigger_category = 'contains' WHERE trigger_category NOT IN ('prefix','contains','exact');
UPDATE public.device_automations SET trigger_type = 'keyword' WHERE trigger_type IS DISTINCT FROM 'keyword';

-- 4) Baru add constraint baru (tanpa regex)
ALTER TABLE public.device_automations ADD CONSTRAINT device_automations_trigger_category_check CHECK (trigger_category IN ('prefix','contains','exact'));
ALTER TABLE public.device_automations ADD CONSTRAINT device_automations_trigger_type_check CHECK (trigger_type IN ('keyword'));

-- 5) Set default trigger_type keyword dan trigger_category contains
ALTER TABLE public.device_automations ALTER COLUMN trigger_type SET DEFAULT 'keyword';
ALTER TABLE public.device_automations ALTER COLUMN trigger_category SET DEFAULT 'contains';

-- 6) Index untuk case sensitive tidak perlu, tapi pastikan RLS tetap
-- RLS sudah via user_owns_device, tidak berubah
