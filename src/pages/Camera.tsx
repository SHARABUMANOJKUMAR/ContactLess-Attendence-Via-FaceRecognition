import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { CheckCircle2, XCircle, Camera as CameraIcon, Loader2 } from "lucide-react";

const Camera = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"scanning" | "success" | "error" | "completed">("scanning");
  const [message, setMessage] = useState("Initializing face detection...");
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    // Check if user data exists
    const roll = localStorage.getItem("roll");
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");

    if (!roll || !name || !email) {
      navigate("/");
      return;
    }

    loadModels();

    return () => {
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
      if (videoRef.current && isModelLoaded && !isProcessing && !hasDetectedRef.current) {
        await detectFace();
      }
    }, 1000);
  };

  const detectFace = async () => {
    if (!videoRef.current || hasDetectedRef.current) return;

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        hasDetectedRef.current = true;
        setIsProcessing(true);
        setMessage("Face detected! Verifying...");
        
        const descriptor = Array.from(detections.descriptor);
        await sendAttendance(descriptor);
      } else {
        setMessage("Position your face in the frame");
      }
    } catch (error) {
      console.error("Detection error:", error);
    }
  };

  const sendAttendance = async (vector: number[]) => {
    try {
      const roll = localStorage.getItem("roll");
      const name = localStorage.getItem("name");
      const email = localStorage.getItem("email");

      const response = await fetch("https://shivashakthi.app.n8n.cloud/webhook/attendence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roll,
          name,
          email,
          vector,
        }),
      });

      const data = await response.json();

      if (data.recognized || data.success) {
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
        
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto object-cover"
        />

        {/* Overlay corners */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary rounded-br-lg" />
      </div>

      {/* Status message */}
      <div className="mt-8 text-center z-10">
        <div className="glass rounded-2xl p-6 max-w-md mx-auto">
          {status === "scanning" && !isProcessing && (
            <div className="flex items-center justify-center gap-3">
              <CameraIcon className="w-6 h-6 text-primary animate-pulse" />
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
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;
