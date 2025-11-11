import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { CheckCircle2, XCircle, Camera as CameraIcon, Loader2, ArrowLeft, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Camera = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"scanning" | "success" | "error" | "completed">("scanning");
  const [message, setMessage] = useState("Checking authentication...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentDescriptor, setCurrentDescriptor] = useState<number[] | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      setUser(session.user);
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        loadModels();
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') {
        navigate("/");
      }
    });

    return () => {
      subscription.unsubscribe();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      stopCamera();
    };
  }, [navigate]);

  const loadModels = async () => {
    try {
      setMessage("Loading AI models...");
      const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setIsModelLoaded(true);
      setMessage("AI models loaded. Starting camera...");
      startCamera();
    } catch (error) {
      console.error("Error loading models:", error);
      setMessage("Error loading AI models. Please refresh.");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setMessage("Position your face in the frame");
        startDetection();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setMessage("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && isModelLoaded && !isProcessing) {
        await detectFace();
      }
    }, 500);
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      // Clear canvas
      const canvas = canvasRef.current;
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (detections) {
        setFaceDetected(true);
        setCurrentDescriptor(Array.from(detections.descriptor));
        setMessage("Face detected! Click capture to mark attendance");

        // Draw detections on canvas
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      } else {
        setFaceDetected(false);
        setCurrentDescriptor(null);
        if (!isProcessing) {
          setMessage("Position your face in the frame");
        }
      }
    } catch (error) {
      console.error("Detection error:", error);
    }
  };

  const handleCapture = async () => {
    if (!currentDescriptor || !faceDetected || isProcessing) return;
    
    hasDetectedRef.current = true;
    setIsProcessing(true);
    setMessage("Verifying...");
    await sendAttendance(currentDescriptor);
  };

  const sendAttendance = async (vector: number[]) => {
    if (!user || !profile) return;
    
    try {
      console.log("Starting attendance submission for:", profile);
      setMessage("Capturing face image...");

      // Capture image from video
      let imageUrl = null;
      if (videoRef.current) {
        console.log("Video element found, capturing image...");
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          console.log("Image drawn to canvas:", canvas.width, "x", canvas.height);
          
          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85);
          });

          console.log("Image blob created, size:", blob.size, "bytes");
          setMessage("Uploading to Cloud...");

          // Upload to Supabase storage
          const fileName = `${profile.roll_number}_${Date.now()}.jpg`;
          console.log("Uploading to storage as:", fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("face-images")
            .upload(fileName, blob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            });

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
          } else {
            console.log("Upload successful:", uploadData);
            // Get public URL
            const { data: urlData } = supabase.storage
              .from("face-images")
              .getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
            console.log("Image URL:", imageUrl);
          }
        }
      }

      // Send to n8n webhook for verification
      setMessage("Verifying face...");
      console.log("Sending to n8n webhook...");
      
      const response = await fetch("https://shivashakthi.app.n8n.cloud/webhook/attendence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roll: profile.roll_number,
          name: profile.full_name,
          email: profile.email,
          vector,
        }),
      });

      const data = await response.json();
      console.log("n8n response:", data);
      
      const isRecognized = data.recognized || data.success;
      const confidenceScore = data.confidence || 0.85;

      // Save to database with image URL
      setMessage("Saving to database...");
      console.log("Inserting into database with user_id:", user.id);

      const { data: insertData, error: dbError } = await supabase
        .from("attendance_records")
        .insert({
          user_id: user.id,
          roll_number: profile.roll_number,
          student_name: profile.full_name,
          email: profile.email,
          confidence_score: confidenceScore,
          status: isRecognized ? "present" : "absent",
          face_vector: vector,
          image_url: imageUrl,
        })
        .select();

      if (dbError) {
        console.error("Error saving to database:", dbError);
      } else {
        console.log("Database insert successful:", insertData);
      }

      if (isRecognized) {
        setStatus("success");
        setMessage("✅ Present Marked");
        setTimeout(() => {
          setStatus("completed");
          setMessage("Attendance Recorded. Check your Email.");
          stopCamera();
        }, 3000);
      } else {
        setStatus("error");
        setMessage("❌ Face Not Matched (Absent)");
        setTimeout(() => {
          hasDetectedRef.current = false;
          setIsProcessing(false);
          setStatus("scanning");
          setMessage("Please try again");
        }, 3000);
      }
    } catch (error) {
      console.error("Error sending attendance:", error);
      setStatus("error");
      setMessage("Connection error. Please try again.");
      setTimeout(() => {
        hasDetectedRef.current = false;
        setIsProcessing(false);
        setStatus("scanning");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Top navigation buttons */}
      <div className="absolute top-6 right-6 z-30 flex gap-3">
        <button
          onClick={() => navigate("/history")}
          className="p-3 glass rounded-full hover:bg-primary/20 transition-all border border-primary/30 hover:border-primary"
          title="View History"
        >
          <History className="w-6 h-6 text-primary" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="p-3 glass rounded-full hover:bg-primary/20 transition-all border border-primary/30 hover:border-primary"
          title="Back to Login"
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-primary rounded-full opacity-30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Face Verification
        </h1>
        <p className="text-muted-foreground">Look at the camera for attendance marking</p>
      </div>

      {/* Camera container */}
      <div className="relative glass rounded-3xl overflow-hidden holographic-border max-w-3xl w-full">
        <div className="scan-line absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 z-20" />
        
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        {/* Overlay corners */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary rounded-tl-lg z-10" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary rounded-tr-lg z-10" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary rounded-bl-lg z-10" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary rounded-br-lg z-10" />
      </div>

      {/* Capture button */}
      {status === "scanning" && !isProcessing && (
        <button
          onClick={handleCapture}
          disabled={!faceDetected || !currentDescriptor}
          className="mt-6 z-10 px-8 py-4 bg-gradient-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <div className="flex items-center gap-3">
            <CameraIcon className="w-6 h-6" />
            Capture Attendance
          </div>
        </button>
      )}

      {/* Status message */}
      <div className="mt-8 text-center z-10">
        <div className="glass rounded-2xl p-6 max-w-md mx-auto">
          {status === "scanning" && !isProcessing && (
            <div className="flex items-center justify-center gap-3">
              <CameraIcon className={`w-6 h-6 ${faceDetected ? 'text-success' : 'text-primary'} ${faceDetected ? 'animate-none' : 'animate-pulse'}`} />
              <p className="text-lg text-foreground">{message}</p>
            </div>
          )}
          
          {isProcessing && status === "scanning" && (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-lg text-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-16 h-16 text-success drop-shadow-glow-success" />
              <p className="text-2xl font-bold text-success">{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="w-16 h-16 text-destructive drop-shadow-glow-error" />
              <p className="text-2xl font-bold text-destructive">{message}</p>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-16 h-16 text-success drop-shadow-glow-success" />
              <p className="text-xl font-semibold text-success">{message}</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 px-6 py-2 bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow-primary transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;
