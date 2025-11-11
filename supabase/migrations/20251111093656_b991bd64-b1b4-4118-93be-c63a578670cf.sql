-- Drop public storage policies that expose biometric data
DROP POLICY IF EXISTS "Anyone can view face images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload face images" ON storage.objects;

-- Ensure only authenticated user policies remain:
-- "Users can view their own face images" - restricts to (storage.foldername(name))[1] = auth.uid()
-- "Users can upload their own face images" - restricts to (storage.foldername(name))[1] = auth.uid()