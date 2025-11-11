-- Add image_url column to attendance_records table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendance_records' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.attendance_records ADD COLUMN image_url TEXT;
  END IF;
END $$;