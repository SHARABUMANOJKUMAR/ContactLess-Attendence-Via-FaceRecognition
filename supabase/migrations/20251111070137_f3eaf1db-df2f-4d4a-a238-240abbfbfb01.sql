-- Make face-images bucket public so URLs work
UPDATE storage.buckets 
SET public = true 
WHERE id = 'face-images';