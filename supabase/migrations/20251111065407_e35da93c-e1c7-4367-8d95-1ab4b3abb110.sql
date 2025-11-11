-- Fix search_path for get_attendance_stats function
DROP FUNCTION IF EXISTS public.get_attendance_stats(TEXT);

CREATE OR REPLACE FUNCTION public.get_attendance_stats(student_email TEXT)
RETURNS TABLE (
  total_records BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  attendance_rate DECIMAL
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
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