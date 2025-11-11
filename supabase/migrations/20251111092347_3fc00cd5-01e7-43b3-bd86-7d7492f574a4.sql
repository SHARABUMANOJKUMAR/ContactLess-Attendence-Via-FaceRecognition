-- Make face-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'face-images';

-- Create RLS policies for face-images bucket
-- Users can only view their own face images
CREATE POLICY "Users can view their own face images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload their own face images
CREATE POLICY "Users can upload their own face images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own face images
CREATE POLICY "Users can update their own face images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own face images
CREATE POLICY "Users can delete their own face images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);