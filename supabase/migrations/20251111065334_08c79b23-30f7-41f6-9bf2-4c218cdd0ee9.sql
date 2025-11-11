-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  confidence_score DECIMAL(5,4),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  face_vector JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_attendance_roll_number ON public.attendance_records(roll_number);
CREATE INDEX idx_attendance_email ON public.attendance_records(email);
CREATE INDEX idx_attendance_created_at ON public.attendance_records(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert attendance records (for marking attendance)
CREATE POLICY "Anyone can mark attendance"
ON public.attendance_records
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to view attendance records (can be restricted later with auth)
CREATE POLICY "Anyone can view attendance records"
ON public.attendance_records
FOR SELECT
TO public
USING (true);

-- Create a function to get attendance statistics
CREATE OR REPLACE FUNCTION public.get_attendance_stats(student_email TEXT)
RETURNS TABLE (
  total_records BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  attendance_rate DECIMAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0) * 100), 
      2
    ) as attendance_rate
  FROM public.attendance_records
  WHERE email = student_email;
$$;