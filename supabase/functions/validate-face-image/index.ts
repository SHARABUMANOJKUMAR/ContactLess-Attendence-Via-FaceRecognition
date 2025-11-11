import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 4000;
const MAX_UPLOADS_PER_DAY = 20;

// Magic bytes for common image formats
const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF
};

interface ValidateRequest {
  imageData: string; // base64 data URL
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { imageData, userId }: ValidateRequest = await req.json();

    // Verify user can only upload for themselves
    if (user.id !== userId) {
      throw new Error("Unauthorized: Cannot upload for another user");
    }

    // Rate limiting: Check uploads in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentUploads, error: countError } = await supabase
      .from("profiles")
      .select("face_photos")
      .eq("id", userId)
      .single();

    if (countError) {
      console.error("Error checking rate limit:", countError);
    }

    // Simple rate limiting based on total photos stored
    const currentPhotoCount = recentUploads?.face_photos?.length || 0;
    if (currentPhotoCount >= MAX_UPLOADS_PER_DAY) {
      throw new Error(`Upload limit exceeded. Maximum ${MAX_UPLOADS_PER_DAY} photos allowed.`);
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const [, declaredType, base64Data] = base64Match;

    // Decode base64
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Validate file size
    if (bytes.length > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (bytes.length < 1000) {
      throw new Error("File too small. Minimum size: 1KB");
    }

    // Validate magic bytes
    let validFormat = false;
    let detectedFormat = "";

    for (const [format, magic] of Object.entries(MAGIC_BYTES)) {
      if (magic.every((byte, i) => bytes[i] === byte)) {
        validFormat = true;
        detectedFormat = format;
        break;
      }
    }

    if (!validFormat) {
      throw new Error("Invalid image format. Only JPEG, PNG, and WebP are allowed.");
    }

    // Validate image dimensions using browser Image API simulation
    // For a real implementation, you'd use an image processing library
    // Here we do basic validation based on common image headers

    // For JPEG, we can extract dimensions from the JPEG header
    if (detectedFormat === "jpeg") {
      let offset = 2; // Skip SOI marker
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xFF) break;
        
        const marker = bytes[offset + 1];
        offset += 2;

        // SOF markers contain dimension info
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
          const width = (bytes[offset + 5] << 8) | bytes[offset + 6];

          if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
            throw new Error(`Image too small. Minimum dimensions: ${MIN_DIMENSION}x${MIN_DIMENSION}`);
          }
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            throw new Error(`Image too large. Maximum dimensions: ${MAX_DIMENSION}x${MAX_DIMENSION}`);
          }
          break;
        }

        // Skip this segment
        const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
        offset += segmentLength;
      }
    }

    // For PNG, dimensions are in IHDR chunk
    if (detectedFormat === "png") {
      // PNG signature is 8 bytes, then IHDR chunk starts
      // IHDR chunk format: 4 bytes length, 4 bytes "IHDR", width(4), height(4), ...
      if (bytes.length >= 24) {
        const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
        const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

        if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
          throw new Error(`Image too small. Minimum dimensions: ${MIN_DIMENSION}x${MIN_DIMENSION}`);
        }
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          throw new Error(`Image too large. Maximum dimensions: ${MAX_DIMENSION}x${MAX_DIMENSION}`);
        }
      }
    }

    console.log(`Image validated: ${detectedFormat}, ${bytes.length} bytes`);

    // Return validated data
    return new Response(
      JSON.stringify({
        valid: true,
        format: detectedFormat,
        size: bytes.length,
        message: "Image validation successful",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message || "Image validation failed",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
