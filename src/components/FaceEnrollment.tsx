import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FaceEnrollmentProps {
  userId: string;
  onComplete: () => void;
}

export const FaceEnrollment = ({ userId, onComplete }: FaceEnrollmentProps) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please allow camera permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPhotos((prev) => [...prev, dataUrl]);
      
      if (photos.length >= 2) {
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotos((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      toast({
        title: "No photos",
        description: "Please capture or upload at least one photo.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // Validate image on server-side before upload
        const { data: validationData, error: validationError } = await supabase.functions.invoke(
          "validate-face-image",
          {
            body: {
              imageData: photo,
              userId: userId,
            },
          }
        );

        if (validationError || !validationData?.valid) {
          throw new Error(validationData?.error || validationError?.message || "Image validation failed");
        }

        const blob = await fetch(photo).then((r) => r.blob());
        const fileName = `${userId}_face_${i}_${Date.now()}.jpg`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("face-images")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            cacheControl: "3600",
          });

        if (error) throw error;

        // Create signed URL (valid for 1 year for enrollment photos)
        const { data: urlData, error: urlError } = await supabase.storage
          .from("face-images")
          .createSignedUrl(filePath, 31536000);

        if (urlError) throw urlError;

        uploadedUrls.push(urlData.signedUrl);
      }

      // Update profile with face photo URLs
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ face_photos: uploadedUrls })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Face photos uploaded successfully.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-foreground text-lg mb-2 block">
          Face Enrollment (Optional - For Better Recognition)
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload or capture 2-3 photos of your face for improved recognition accuracy
        </p>
      </div>

      {/* Camera preview */}
      {cameraActive && (
        <div className="relative glass rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button
              onClick={capturePhoto}
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow-primary"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              className="glass border-destructive/30 hover:border-destructive"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!cameraActive && (
        <div className="flex gap-3">
          <Button
            onClick={startCamera}
            variant="outline"
            className="flex-1 glass border-primary/30 hover:border-primary"
          >
            <Camera className="w-4 h-4 mr-2" />
            Use Camera
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1 glass border-accent/30 hover:border-accent"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div>
          <Label className="text-foreground mb-2 block">
            Captured Photos ({photos.length})
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative glass rounded-lg overflow-hidden aspect-square">
                <img
                  src={photo}
                  alt={`Face ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      {photos.length > 0 && (
        <Button
          onClick={uploadPhotos}
          disabled={uploading}
          className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow-primary transition-all"
        >
          {uploading ? "Uploading..." : `Upload ${photos.length} Photo${photos.length > 1 ? 's' : ''}`}
        </Button>
      )}

      {/* Skip button */}
      <Button
        onClick={onComplete}
        variant="outline"
        className="w-full glass border-muted/30 hover:border-muted"
      >
        Skip for Now
      </Button>
    </div>
  );
};
