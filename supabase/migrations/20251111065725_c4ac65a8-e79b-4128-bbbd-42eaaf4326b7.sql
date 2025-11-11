-- Create storage bucket for face images
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-images', 'face-images', false);

-- Create RLS policies for face-images bucket
CREATE POLICY "Anyone can upload face images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'face-images');

CREATE POLICY "Anyone can view face images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'face-images');

-- Add image_url column to attendance_records table
ALTER TABLE public.attendance_records
ADD COLUMN image_url TEXT;