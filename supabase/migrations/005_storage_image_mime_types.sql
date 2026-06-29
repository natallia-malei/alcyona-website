-- Restrict 'covers' and 'photos' buckets to image MIME types only
-- Prevents accidental upload of PDF/EXE/etc through public RLS
-- Apply in Supabase Dashboard → SQL Editor → Run

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/bmp'
]
WHERE id IN ('covers', 'photos');
