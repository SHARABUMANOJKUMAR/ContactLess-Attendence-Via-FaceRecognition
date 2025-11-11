-- Add QR code and face photos support to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS face_photos TEXT[] DEFAULT '{}';

-- Function to generate unique QR code
CREATE OR REPLACE FUNCTION public.generate_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_qr TEXT;
  qr_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 12 character alphanumeric string
    new_qr := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE qr_code = new_qr) INTO qr_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT qr_exists;
  END LOOP;
  
  RETURN new_qr;
END;
$$;

-- Trigger to auto-generate QR code on profile creation
CREATE OR REPLACE FUNCTION public.set_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := generate_qr_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profile_qr_code ON public.profiles;
CREATE TRIGGER set_profile_qr_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_qr_code();

-- Update existing profiles to have QR codes
UPDATE public.profiles
SET qr_code = generate_qr_code()
WHERE qr_code IS NULL;